export function date(dateStr: string, format: string = "DD MMM YYYY"): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Invalid Date";

  const options: Intl.DateTimeFormatOptions = {};
  if (format.includes("YYYY") || format.includes("YY")) {
    options.year = format.includes("YYYY") ? "numeric" : "2-digit";
  }
  if (format.includes("MMMM") || format.includes("MMM") || format.includes("MM") || format.includes("M")) {
    options.month = format.includes("MMMM") ? "long" : format.includes("MMM") ? "short" : format.includes("MM") ? "2-digit" : "numeric";
  }
  if (format.includes("DD") || format.includes("D")) {
    options.day = format.includes("DD") ? "2-digit" : "numeric";
  }
  if (format.includes("HH") || format.includes("H") || format.includes("hh") || format.includes("h")) {
    options.hour = (format.includes("HH") || format.includes("hh")) ? "2-digit" : "numeric";
    options.hour12 = format.includes("hh") || format.includes("h");
  }
  if (format.includes("mm") || format.includes("m")) {
    options.minute = format.includes("mm") ? "2-digit" : "numeric";
  }
  if (format.includes("ss") || format.includes("s")) {
    options.second = format.includes("ss") ? "2-digit" : "numeric";
  }

  const parts = new Intl.DateTimeFormat("id-ID", options).formatToParts(d);
  let result = format;

  if (format.includes("YYYY")) {
    result = result.replace("YYYY", parts.find(p => p.type === "year")?.value || "");
  } else if (format.includes("YY")) {
    result = result.replace("YY", (parts.find(p => p.type === "year")?.value || "").slice(-2));
  }

  if (format.includes("MMMM")) {
    result = result.replace("MMMM", parts.find(p => p.type === "month")?.value || "");
  } else if (format.includes("MMM")) {
    result = result.replace("MMM", parts.find(p => p.type === "month")?.value || "");
  } else if (format.includes("MM")) {
    result = result.replace("MM", parts.find(p => p.type === "month")?.value || "");
  } else if (format.includes("M")) {
    result = result.replace("M", parts.find(p => p.type === "month")?.value || "");
  }

  if (format.includes("DD")) {
    result = result.replace("DD", parts.find(p => p.type === "day")?.value || "");
  } else if (format.includes("D")) {
    result = result.replace("D", parts.find(p => p.type === "day")?.value || "");
  }

  if (format.includes("HH")) {
    result = result.replace("HH", parts.find(p => p.type === "hour")?.value || "");
  } else if (format.includes("H")) {
    result = result.replace("H", parts.find(p => p.type === "hour")?.value || "");
  } else if (format.includes("hh")) {
    result = result.replace("hh", parts.find(p => p.type === "hour")?.value || "");
  } else if (format.includes("h")) {
    result = result.replace("h", parts.find(p => p.type === "hour")?.value || "");
  }

  if (format.includes("mm")) {
    result = result.replace("mm", parts.find(p => p.type === "minute")?.value || "");
  } else if (format.includes("m")) {
    result = result.replace("m", parts.find(p => p.type === "minute")?.value || "");
  }

  if (format.includes("ss")) {
    result = result.replace("ss", parts.find(p => p.type === "second")?.value || "");
  } else if (format.includes("s")) {
    result = result.replace("s", parts.find(p => p.type === "second")?.value || "");
  }

  return result;
}
