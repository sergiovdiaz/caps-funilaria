export function getValueColor(value, metricName) {
  if (typeof value !== "number") return "value-neutral";

  switch (metricName) {
    case "totalCount":
      return "value-neutral";
    case "average":
      return value > 50 ? "value-critical" : "value-success";
    case "last":
      return value > 50 ? "value-critical" : "value-success";
    case "min":
      return value > 50 ? "value-critical" : "value-neutral";
    case "outPercentage":
      console.log;
      ("Calculando cor para % Out:", value);
      return value > 40 ? "value-critical" : "value-success";
    case "outAverage":
      return value > 50 ? "value-critical" : "value-neutral";
    default:
      return "value-neutral";
  }
}
