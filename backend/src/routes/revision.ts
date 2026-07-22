import { Router } from "express"
import { handleRevision } from "../controller/RevisionController"

export const revisionRouter = Router()

revisionRouter.post("/revision", handleRevision)
