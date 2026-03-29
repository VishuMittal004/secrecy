const mongoose = require("mongoose");

const EntrySchema = new mongoose.Schema({
  author: { type: String, required: true },
  authorId: { type: String, required: true },
  content: { type: String, default: "" },
  image: { type: String, default: null },
  replyTo: { type: Object, default: null },
  timestamp: { type: Date, default: Date.now },
});

// Ensure virtual 'id' is serialized and '_id' is removed for frontend compatibility
EntrySchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    delete ret._id;
  },
});

module.exports = mongoose.model("Entry", EntrySchema);
