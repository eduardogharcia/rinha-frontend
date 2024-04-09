const buffersize = 200000;

onmessage = function (e) {
  try {
    console.time("parse-json");
    const parsed = JSON.parse(e.data);
    console.timeEnd("parse-json");

    console.time("flatten-json");
    const flatened = flattenJSONObj(parsed);
    console.timeEnd("flatten-json");

    console.time("send-back");

    for (let index = 0; index < flatened.length; index = index + buffersize) {
      const finalJsonStringfied = JSON.stringify(
        flatened.slice(index, index + buffersize)
      );
      const enc = new TextEncoder();
      const encoded = enc.encode(finalJsonStringfied);
      const encodedBuffer = encoded.buffer;

      this.postMessage({ type: "CHUNK", data: encodedBuffer }, [encodedBuffer]);
    }

    this.postMessage({ type: "EOF" });

    console.timeEnd("send-back");
    console.log(chunkAmount, "chunks of", buffersize, "items max");
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
