import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workersRouter from "./workers";
import earningsRouter from "./earnings";
import zonesRouter from "./zones";
import emergenciesRouter from "./emergencies";
import compensationRouter from "./compensation";
import accidentsRouter from "./accidents";
import insuranceRouter from "./insurance";
import complaintsRouter from "./complaints";
import notificationsRouter from "./notifications";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(workersRouter);
router.use(earningsRouter);
router.use(zonesRouter);
router.use(emergenciesRouter);
router.use(compensationRouter);
router.use(accidentsRouter);
router.use(insuranceRouter);
router.use(complaintsRouter);
router.use(notificationsRouter);
router.use(dashboardRouter);

export default router;
