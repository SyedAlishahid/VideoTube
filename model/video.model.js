const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    videofile: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {  type: String,
      required: true,
    },
    published: {
        type: Boolean,
        required: true,
    },
    createdby: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

const Video = mongoose.model("Video", videoSchema);

module.exports = Video;