let linestatusRulesMap = new Map();

export function setLinestatusRules(rules) {
  linestatusRulesMap = new Map(rules.map((rule) => [rule.priority, rule]));
}

export function getLinestatusRuleByPriority(priority) {
  return linestatusRulesMap.get(priority) || null;
}

export function getAllLinestatusRules() {
  return Array.from(linestatusRulesMap.values());
}
