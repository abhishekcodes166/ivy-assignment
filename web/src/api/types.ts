export type Furnishing = 'unfurnished' | 'semi-furnished' | 'fully-furnished';

export type PropertyType =
  | 'apartment'
  | 'villa'
  | 'plot'
  | 'builder floor'
  | 'independent house';

export type PostedBy = 'builder' | 'owner' | 'agent';

export type ProjectStatus = 'new launch' | 'ready to move' | 'under construction';

export interface Listing {
  listing_id: string;
  listing_url: string;
  website: string;
  city_id: number;
  apartment_name: string;
  locality: string;
  property_type: PropertyType;
  bedroom: number;
  bathroom: number;
  balcony: number;
  floor: number;
  total_floors: number;
  furnishing: Furnishing;
  facing_direction: string;
  covered_parking: number;
  price: number;
  carpet_area: number;
  super_built_up_area: number;
  latitude: number;
  longitude: number;
  posted_by: PostedBy;
  posted_by_name: string;
  posted_by_contact: string;
  project_id: string;
  is_verified: boolean;
  description: string;
  posted_at: string;
  is_live: boolean;
}

/** Rentals use `super_builtup_area` — a different spelling from the sale listings' `super_built_up_area`. */
export interface Rental {
  listing_id: string;
  listing_url: string;
  website: string;
  city_id: number;
  title: string;
  apartment_name: string;
  locality: string;
  property_type: PropertyType;
  bedroom: number;
  bathroom: number;
  floor: number;
  total_floors: number;
  furnishing: Furnishing;
  facing_direction: string;
  price: number;
  deposit: number;
  maintenance: number;
  carpet_area: number;
  super_builtup_area: number;
  latitude: number;
  longitude: number;
  posted_by: PostedBy;
  posted_by_name: string;
  posted_by_contact: string;
  description: string;
  posted_at: string;
  is_live: boolean;
}

export interface Project {
  project_id: string;
  project_url: string;
  city_id: number;
  apartment_name: string;
  developer_name: string;
  locality: string;
  project_status: ProjectStatus;
  total_units: number;
  total_towers: number;
  total_floors: number;
  launch_date: string;
  possession_date: string;
  rera_number: string;
  min_area_sqft: number;
  max_area_sqft: number;
  amenities: string[];
  latitude: number;
  longitude: number;
  total_listings: number;
  price_min: number;
  price_max: number;
}

export interface Envelope<T> {
  limit: number;
  offset: number;
  count: number;
  total: number;
  has_more: boolean;
  results: T[];
}

export interface AuthUser {
  email: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  refresh_url: string;
  user: AuthUser;
}

export interface SavedMutationResponse {
  ok: boolean;
  listing_id: string;
  saved_count: number;
}
