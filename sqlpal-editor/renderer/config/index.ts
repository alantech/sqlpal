import prod from './prod';
import { ConfigEnvironments, ConfigInterface } from './config';
import local from './local';

const config: { [key in ConfigEnvironments]: ConfigInterface } = {
  prod,
  local,
};

export default config;
