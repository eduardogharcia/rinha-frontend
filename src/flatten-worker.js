const buffersize = 200000;

onmessage = function (e) {
  try {
    const parsed = JSON.parse(e.data);
    const flatened = flattenJSONObj(parsed);

    let buffer = [];

    for (let index = 0; index < flatened.length; index++) {
      buffer.push(flatened[index]);

      if (buffer.length >= 200000) {
        this.postMessage({ type: "CHUNK", data: buffer });
        buffer = [];
      }
    }

    this.postMessage({ type: "CHUNK", data: buffer });

    this.postMessage({ type: "EOF" });
  } catch (error) {
    this.postMessage({ type: "ERROR" });
    return;
  }
};

function flattenJSONObj(obj, prevNormalized = [], level = 0) {
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
