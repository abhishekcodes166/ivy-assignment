export function createPropertyIdentity(listing) {
  if (listing.project_id) {
    return `${listing.project_id}_${listing.bedroom}_${listing.apartment_name}`;
  }

  const components = [
    listing.locality || '',
    listing.apartment_name || '',
    Math.round((listing.carpet_area || 0) / 100) * 100,
    Math.round((listing.floor || 0)),
    listing.facing_direction || ''
  ];

  return components.filter(c => c !== '').join('__');
}

export function findDuplicates(listings) {
  const propertyMap = new Map();
  const duplicates = [];

  for (const listing of listings) {
    const identity = createPropertyIdentity(listing);

    if (!propertyMap.has(identity)) {
      propertyMap.set(identity, []);
    }
    propertyMap.get(identity).push(listing);
  }

  for (const [identity, records] of propertyMap.entries()) {
    if (records.length > 1) {
      duplicates.push({
        identity,
        count: records.length,
        listing_ids: records.map(r => r.listing_id),
        records
      });
    }
  }

  return {
    total_unique_properties: propertyMap.size,
    duplicate_groups: duplicates.length,
    duplicates
  };
}

export function findCorruptListings(listings) {
  const corrupt = [];

  for (const listing of listings) {
    const issues = [];

    if (listing.bathroom && listing.bedroom) {
      if (listing.bathroom > listing.bedroom * 2) {
        issues.push(`bathroom_count (${listing.bathroom}) > bedroom_count (${listing.bedroom}) * 2`);
      }
      if (listing.bathroom === 0 && listing.bedroom > 0) {
        issues.push(`zero_bathrooms_with_positive_bedrooms`);
      }
    }

    if (listing.floor && listing.total_floors) {
      if (listing.floor > listing.total_floors) {
        issues.push(`floor (${listing.floor}) > total_floors (${listing.total_floors})`);
      }
      if (listing.floor === 0 && listing.total_floors > 1) {
        issues.push(`ground_floor_marked_as_0`);
      }
    }

    if (listing.carpet_area && listing.super_built_up_area) {
      if (listing.carpet_area > listing.super_built_up_area) {
        issues.push(`carpet_area (${listing.carpet_area}) > super_built_up_area (${listing.super_built_up_area})`);
      }
      const ratio = listing.super_built_up_area / listing.carpet_area;
      if (ratio > 2.5 || ratio < 1.1) {
        issues.push(`unusual_carpet_to_super_ratio (${ratio.toFixed(2)})`);
      }
    }

    if (listing.price < 0) {
      issues.push(`negative_price (${listing.price})`);
    }
    if (listing.price === 0) {
      issues.push(`zero_price`);
    }

    if (listing.carpet_area && listing.carpet_area < 200) {
      if (listing.bedroom > 2) {
        issues.push(`unusually_small_area_for_bhk (${listing.carpet_area} sqft for ${listing.bedroom}BHK)`);
      }
    }

    if (listing.balcony && listing.bedroom) {
      if (listing.balcony > listing.bedroom + 1) {
        issues.push(`balcony_count (${listing.balcony}) > bedroom_count + 1 (${listing.bedroom + 1})`);
      }
    }

    if (listing.covered_parking && listing.covered_parking > 3) {
      issues.push(`unusually_high_parking_count (${listing.covered_parking})`);
    }

    if (issues.length > 0) {
      corrupt.push({
        listing_id: listing.listing_id,
        issues,
        listing
      });
    }
  }

  return corrupt;
}

export function findFakeListings(listings) {
  const fake = [];

  const byPhoneNumber = new Map();
  const byDescription = new Map();

  for (const listing of listings) {
    const phone = listing.posted_by_contact;
    if (phone) {
      if (!byPhoneNumber.has(phone)) {
        byPhoneNumber.set(phone, []);
      }
      byPhoneNumber.get(phone).push(listing);
    }

    const desc = listing.description ? listing.description.toLowerCase() : '';
    if (desc) {
      if (!byDescription.has(desc)) {
        byDescription.set(desc, []);
      }
      byDescription.get(desc).push(listing);
    }
  }

  for (const [desc, records] of byDescription.entries()) {
    if (records.length > 5 && desc.length > 50) {
      const uniqueAgents = new Set(records.map(r => r.posted_by_name));
      if (uniqueAgents.size === 1) {
        for (const record of records) {
          if (!fake.some(f => f.listing_id === record.listing_id)) {
            fake.push({
              listing_id: record.listing_id,
              reason: 'identical_description_many_listings',
              details: {
                count_with_same_desc: records.length,
                agent: record.posted_by_name,
                description: desc.substring(0, 100)
              },
              evidence_items: records.map(r => r.listing_id)
            });
          }
        }
      }
    }
  }

  for (const listing of listings) {
    const reasons = [];

    const priceStr = listing.price?.toString() || '';
    if (/(\d)\1{2,}/.test(priceStr)) {
      reasons.push('repeating_digits_in_price');
    }

    if (priceStr.endsWith('0000000')) {
      reasons.push('price_ends_with_many_zeros');
    }

    if (listing.carpet_area && listing.carpet_area % 100 === 0 &&
        listing.carpet_area !== Math.round(listing.carpet_area / 100) * 100) {
      reasons.push('suspiciously_round_carpet_area');
    }

    if (reasons.length > 0) {
      if (reasons.length > 1) {
        fake.push({
          listing_id: listing.listing_id,
          reason: 'multiple_systematic_patterns',
          details: { patterns: reasons },
          listing
        });
      }
    }
  }

  return fake;
}

export function checkEndpointConsistency(allListings, allRentals, allProjects) {
  const issues = [];

  const listingMap = new Map(allListings.map(l => [l.listing_id, l]));
  const rentalMap = new Map(allRentals.map(r => [r.listing_id, r]));

  const saleIds = new Set(allListings.map(l => l.listing_id));
  const rentalIds = new Set(allRentals.map(r => r.listing_id));
  const overlap = [...saleIds].filter(id => rentalIds.has(id));

  if (overlap.length > 0) {
    issues.push({
      type: 'sale_rental_overlap',
      count: overlap.length,
      examples: overlap.slice(0, 5)
    });
  }

  const projectListingCounts = new Map();
  for (const listing of allListings) {
    if (listing.project_id) {
      const count = projectListingCounts.get(listing.project_id) || 0;
      projectListingCounts.set(listing.project_id, count + 1);
    }
  }

  const projectMismatches = [];
  for (const project of allProjects) {
    const expectedCount = projectListingCounts.get(project.project_id) || 0;
    if (expectedCount !== project.total_listings) {
      projectMismatches.push({
        project_id: project.project_id,
        project_name: project.apartment_name,
        claimed: project.total_listings,
        actual: expectedCount,
        difference: project.total_listings - expectedCount
      });
    }
  }

  if (projectMismatches.length > 0) {
    issues.push({
      type: 'project_listing_count_mismatch',
      count: projectMismatches.length,
      mismatches: projectMismatches
    });
  }

  return {
    issues,
    projectMismatches
  };
}

export function analyzeDistribution(listings) {
  const stats = {
    total: listings.length,
    by_bedroom: {},
    by_furnishing: {},
    by_property_type: {},
    price_distribution: {
      min: Infinity,
      max: -Infinity,
      mean: 0,
      median: 0
    },
    area_distribution: {
      min: Infinity,
      max: -Infinity,
      mean: 0
    }
  };

  const prices = [];
  const areas = [];
  let totalPrice = 0;
  let totalArea = 0;

  for (const listing of listings) {
    const bhk = listing.bedroom || 0;
    stats.by_bedroom[bhk] = (stats.by_bedroom[bhk] || 0) + 1;

    const furn = listing.furnishing || 'unknown';
    stats.by_furnishing[furn] = (stats.by_furnishing[furn] || 0) + 1;

    const ptype = listing.property_type || 'unknown';
    stats.by_property_type[ptype] = (stats.by_property_type[ptype] || 0) + 1;

    if (listing.price) {
      prices.push(listing.price);
      totalPrice += listing.price;
      stats.price_distribution.min = Math.min(stats.price_distribution.min, listing.price);
      stats.price_distribution.max = Math.max(stats.price_distribution.max, listing.price);
    }

    if (listing.carpet_area) {
      areas.push(listing.carpet_area);
      totalArea += listing.carpet_area;
      stats.area_distribution.min = Math.min(stats.area_distribution.min, listing.carpet_area);
      stats.area_distribution.max = Math.max(stats.area_distribution.max, listing.carpet_area);
    }
  }

  stats.price_distribution.mean = Math.round(totalPrice / listings.length);
  if (prices.length > 0) {
    prices.sort((a, b) => a - b);
    const mid = Math.floor(prices.length / 2);
    stats.price_distribution.median = prices.length % 2
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;
  }

  stats.area_distribution.mean = Math.round(totalArea / listings.length);
  if (areas.length > 0) {
    areas.sort((a, b) => a - b);
    const mid = Math.floor(areas.length / 2);
    stats.area_distribution.median = areas.length % 2
      ? areas[mid]
      : (areas[mid - 1] + areas[mid]) / 2;
  }

  return stats;
}

export default {
  createPropertyIdentity,
  findDuplicates,
  findCorruptListings,
  findFakeListings,
  checkEndpointConsistency,
  analyzeDistribution
};
