import dotenv from "dotenv"
import connectdb from "./db/index.js";

dotenv.config({
    path: './env'
})
connectdb()
.then(()=> {
app.Listen(process.env.PORT || 8000,()=>{
    console.log(`server is runnign at ${process.env.PORT}`)
})
// app.on("error",(error)=>{
//     console.log("ERROR: " ,error);
//     throw error
// })np
})
.catch((err)=>{
    console.log("connection failed: " , err);
})