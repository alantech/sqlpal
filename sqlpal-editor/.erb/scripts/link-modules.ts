import fs from 'fs';
import webpackPaths from '../configs/webpack.paths';

const { rootNodeModulesPath } = webpackPaths;
const { appNodeModulesPath } = webpackPaths;

if (fs.existsSync(rootNodeModulesPath) && !fs.existsSync(appNodeModulesPath)) {
  fs.symlinkSync(rootNodeModulesPath, appNodeModulesPath, 'junction');
}
