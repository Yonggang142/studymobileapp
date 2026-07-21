import { Router } from "express";

import { analysisRouter } from "./Analysis";
const masterRouter = Router();


masterRouter.use("/analysis", analysisRouter);


export default masterRouter;