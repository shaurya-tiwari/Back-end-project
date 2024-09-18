import { APIerror } from "../utils/apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        const token = req.cookies?.accesToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // console.log(token);
        if (!token) {
            throw new APIerror(401, "Unauthorized request")
        }
    
        const decodedToken =jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-passwords -refreshtoken")
    
        if (!user) {
            
            throw new APIerror(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new APIerror(401, error?.message || "Invalid access token")
    }
    
})
