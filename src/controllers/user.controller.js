import { asychandler } from "../utils/asynchandler.js";


const registeruser= asychandler(async (req,res,)=>{
    res.status(200).json({
        message:"success full API testing from postman"
    })
})

export {registeruser}