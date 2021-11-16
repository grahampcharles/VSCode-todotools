import dayjs = require("dayjs");
import YAML = require("yaml");
import { testYaml } from "./test/suite/testdata";

//const settings = YAML.parse(testYaml);
//console.log(settings);

const day = dayjs();

console.log(day.format("YYYY-MM-DDThh:nnZ"));