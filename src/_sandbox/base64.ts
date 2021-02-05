const b64 = {
  atob: function (str: string) {
    return Buffer.from(str || "", "base64").toString("utf8");
  },
  btoa: function (str: string) {
    return Buffer.from(str || "").toString("base64");
  },
};
export default b64;
