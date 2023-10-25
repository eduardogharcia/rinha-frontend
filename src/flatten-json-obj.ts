function flattenJSONObj(obj: any, prevNormalized: any = [], level = 0) {
  for (const key in obj) {
    if (typeof obj[key] !== "object") {
      prevNormalized.push({ type: "PRIMTIVE", key, value: obj[key], level });
    } else {
      if (obj[key] == null) {
        prevNormalized.push({ type: "PRIMTIVE", key, value: "null", level });
      } else {
        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "ARRAY_START", key, value: "[", level });
        } else {
          prevNormalized.push({ type: "OBJECT_START", key, value: "{", level });
        }

        flattenJSONObj(obj[key], prevNormalized, level + 1);

        if (Array.isArray(obj[key])) {
          prevNormalized.push({ type: "OBJECT_START", value: "]", level });
        } else {
          prevNormalized.push({ type: "OBJECT_END", value: "}", level });
        }
      }
    }
  }

  return prevNormalized;
}

export default flattenJSONObj;
