import { Router } from "express";

import { analysisRouter } from "./Analysis";

import { loggingRouter } from "./Logging";
import { revisionRouter } from "./revision";
const masterRouter = Router();


masterRouter.use("/analysis", analysisRouter);
masterRouter.use("/revision", revisionRouter);
masterRouter.use("/logging", loggingRouter);


export default masterRouter;