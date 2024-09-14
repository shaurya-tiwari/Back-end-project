import mongoose, { Schema } from "mongoose";
// installed mongoose-aggregate-paginate-v2 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";


const videoSchema = new Schema(
  {
    videofile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
        type:String,
        required: true,
    },
    views:{
        type: Number,
        default: 0,
    },
    ispublished:{
        type: Boolean,
        default: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    }
  },
  { timestamps: true }
);
videoSchema.plugins(mongooseAggregatePaginate)
export const video = mongoose.model("video", videoSchema);
