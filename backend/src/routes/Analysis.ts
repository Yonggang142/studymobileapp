import { Router } from "express"
import multer from "multer"
import { handleAnalysis } from "../controller/AnalysisController"

const upload = multer({ dest: 'uploads/' })

export const analysisRouter = Router()

analysisRouter.post("/", upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'answerFile', maxCount: 1 }])
    , handleAnalysis)
