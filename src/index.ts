import { API } from 'homebridge';
import { PLATFORM_NAME } from './settings.js';
import { SwitchbotPlatform } from './platform/SwitchbotPlatform.js';


export default (api: API) => {
	api.registerPlatform(PLATFORM_NAME, SwitchbotPlatform);
};
