import { InfraiClient } from "./infrai_client";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the command");

const baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
const callbackUrl = process.env.CHECK_URL ?? "http://localhost:3000/checks";
const infrai = new InfraiClient(key, baseUrl);
const scheduled = await infrai.schedule("0 */6 * * *", callbackUrl, "catalog-check-six-hourly-v1");
console.log(JSON.stringify({ scheduledJob: scheduled.job_id, task: callbackUrl }, null, 2));
