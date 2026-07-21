import { Router } from "express"
import multer from "multer"
import { handleAnalysis } from "../controller/AnalysisController"

const upload = multer({ dest: 'uploads/' })

export const analysisRouter = Router()

analysisRouter.post("/analysis", upload.single('file'), handleAnalysis)
