export class Hypothesis {
  constructor(id, claim, reason) {
    this.id = id;
    this.claim = claim;
    this.why_suspected = reason;
    this.tests = [];
    this.result = null;
    this.evidence = [];
    this.conclusion = null;
    this.created_at = new Date().toISOString();
  }

  addTest(test) {
    this.tests.push({
      description: test,
      timestamp: new Date().toISOString()
    });
  }

  addEvidence(item, description) {
    this.evidence.push({
      item,
      description,
      timestamp: new Date().toISOString()
    });
  }

  setResult(result, details = '') {
    this.result = result;
    this.result_details = details;
  }

  conclude(conclusion) {
    this.conclusion = conclusion;
  }

  toMarkdown() {
    return `# Hypothesis ${this.id}

## Claim
${this.claim}

## Why I suspected it
${this.why_suspected}

## Tests
${this.tests.map(t => `- ${t.description}`).join('\n')}

## Result
${this.result || 'pending'}
${this.result_details ? `\nDetails: ${this.result_details}` : ''}

## Evidence
${this.evidence.length > 0
  ? this.evidence.map(e => `- ${e.item}: ${e.description}`).join('\n')
  : 'None yet'
}

## Conclusion
${this.conclusion || 'PENDING'}

---
`;
  }
}

export class HypothesisLog {
  constructor() {
    this.hypotheses = new Map();
    this.nextId = 1;
  }

  create(claim, reason) {
    const id = this.nextId++;
    const hypothesis = new Hypothesis(id, claim, reason);
    this.hypotheses.set(id, hypothesis);
    console.log(`\n📋 Hypothesis ${id} created: "${claim}"`);
    return hypothesis;
  }

  get(id) {
    return this.hypotheses.get(id);
  }

  all() {
    return Array.from(this.hypotheses.values());
  }

  toMarkdown() {
    const content = Array.from(this.hypotheses.values())
      .sort((a, b) => a.id - b.id)
      .map(h => h.toMarkdown())
      .join('\n');

    return `# Hypothesis Log
Investigation Date: ${new Date().toISOString()}
Total Hypotheses: ${this.hypotheses.size}

${content}`;
  }

  async save(filepath) {
    const fs = await import('fs');
    fs.writeFileSync(filepath, this.toMarkdown(), 'utf8');
    console.log(`✓ Hypothesis log saved to ${filepath}`);
  }
}

export default HypothesisLog;
