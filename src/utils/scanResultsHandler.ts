import { Ad } from 'node-switchbot/dist/advertising';
import { Optional } from '../types/generalTypes';
import {
	ServiceData,
	SwitchbotDeviceWoHand,
	SwitchbotMetadata,
} from '../types/switchBotTypes';
import {
	SwitchBotBLEModel,
	SwitchBotBLEModelFriendlyName,
	SwitchBotBLEModelName,
} from 'node-switchbot';

export const adaptSBDeviceScanResults = (scannedDevices: Optional<unknown>) => {
	if (!scannedDevices || !Array.isArray(scannedDevices)) {
		return null;
	}

	if (scannedDevices.length <= 0) {
		return null;
	}

	const scannedDevice = scannedDevices[0] as SwitchbotDeviceWoHand;
	return scannedDevice;
};

export const adaptSwitchBotAdvertisdementData = (
	advertisementData: Ad,
): Optional<SwitchbotMetadata> => {
	if (!advertisementData) {
		return null;
	}

	const serviceData = _adaptSwitchBotServiceData(advertisementData.serviceData);
	if (!serviceData) {
		return null;
	}

	return {
		id: advertisementData.id,
		address: advertisementData.address,
		rssi: advertisementData.rssi,
		serviceData: serviceData,
	};
};

const _adaptSwitchBotServiceData = (
	serviceData?: Record<string, unknown>,
): Optional<ServiceData> => {
	if (
		!serviceData ||
		!serviceData['model'] ||
		!serviceData['modelName'] ||
		!serviceData['modelFriendlyName'] ||
		!serviceData['battery']
	) {
		return null;
	}

	return {
		model: serviceData['model'] as SwitchBotBLEModel,
		modelName: serviceData['modelName'] as SwitchBotBLEModelName,
		modelFriendlyName: serviceData[
			'modelFriendlyName'
		] as SwitchBotBLEModelFriendlyName,
		battery: serviceData['battery'] as number,
		mode: serviceData['mode'] as boolean,
	};
};
