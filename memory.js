// =========================
// Sambhav AI Memory System
// =========================

const Memory = {

  getAll() {
    return JSON.parse(
      localStorage.getItem("sambhav_memory") || "{}"
    );
  },

  saveAll(data) {
    localStorage.setItem(
      "sambhav_memory",
      JSON.stringify(data)
    );
  },

  set(key, value) {
    const data = this.getAll();
    data[key] = value;
    this.saveAll(data);
  },

  get(key) {
    const data = this.getAll();
    return data[key] || null;
  },

  remove(key) {
    const data = this.getAll();
    delete data[key];
    this.saveAll(data);
  }

};
