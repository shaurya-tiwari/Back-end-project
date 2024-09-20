import mongoose, { Schema } from "mongoose";
// installed mongoose-aggregate-paginate-v2 
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { video } from "./video.model";


const commentSchema = new Schema(
    {

        content:{
            typeof: 'string',
            required: true
        },
        video:{
            type: Schema.Types.ObjectId,
            ref: "video",
           
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User",
           
        },
        
    },
    {
        timestamps: true  
    }
)

commentSchema.plugins(mongooseAggregatePaginate)


export const Comment = mongoose.model("Comment", commentSchema)