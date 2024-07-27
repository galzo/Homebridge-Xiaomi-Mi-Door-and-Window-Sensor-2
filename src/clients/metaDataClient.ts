import { Logger } from 'homebridge';
import NodeCache from 'node-cache';
import {
	CACHE_TTL,
	CHECK_CACHE_TTL_PERIOD,
	DEFAULT_BATTERY_LEVEL,
} from '../settings.js';
import { SwitchbotOperationMode } from '../types/accessoryTypes.js';
import { Optional } from '../types/generalTypes.js';
import { logSwitchbotClientError } from '../utils/errorLogger.js';
import { SwitchBot } from 'node-switchbot';
import { Ad } from 'node-switchbot/dist/advertising.js';
import { SwitchbotMetadata } from '../types/switchBotTypes.js';
import { adaptSwitchBotAdvertisdementData } from '../utils/scanResultsHandler.js';

export class MetadataClient {
	private log: Logger;
	private readonly client = new SwitchBot();

	private readonly metaDataCache = new NodeCache({
		stdTTL: CACHE_TTL,
		checkperiod: CHECK_CACHE_TTL_PERIOD,
		// We want to store a clone of the metadata, since
		// it is the recommended method of caching things using
		// node-cache
		useClones: true,
		deleteOnExpire: true,
	});

	private isScanningForMetadata = false;

	constructor(log: Logger) {
		this.log = log;
		this.client.onadvertisement = this.handleScannedAdvertisdementData;
	}

	/**
	 * Retreives the bot's operation mode.
	 * There are two possible modes of operation: switch and press.
	 * When the bot is set to switch mode, it behaves as a switch, this means it has "ON"/"OFF" states.
	 * When the bot is set to press mode, it has no "ON"/"OFF" state, but rather a single mode - press mode.
	 * Setting the bot's operation mode can be done via the offical SwitchBot application.
	 */
	public getDeviceOperationMode = (
		address: string,
		scanDuration: number,
	): SwitchbotOperationMode => {
		this.log.info(`Getting operation mode for device (address ${address})`);
		const metaData = this.getDeviceMetaData(address, scanDuration);
		const isSwitchMode = metaData?.serviceData?.mode ?? true;
		return isSwitchMode ? 'switch' : 'press';
	};

	public getDeviceBatteryStatus = (address: string, scanDuration: number) => {
		this.log.info(`Getting Battery level for device (address ${address})`);
		const metaData = this.getDeviceMetaData(address, scanDuration);
		return metaData?.serviceData?.battery ?? DEFAULT_BATTERY_LEVEL;
	};

	private getDeviceMetaData = (
		address: string,
		scanDuration: number,
	): Optional<SwitchbotMetadata> => {
		const metaData = this.getMetadataFromCache(address);

		if (!metaData && !this.isScanningForMetadata) {
			this.log.info(
				`No metadata was found on cache for device (address ${address})`,
			);
			this.scanForDeviceMetadata(address, scanDuration);
		}

		return metaData;
	};

	private scanForDeviceMetadata = async (
		address: string,
		scanDuration: number,
	) => {
		try {
			this.log.info('Scanning for device metadata');
			this.isScanningForMetadata = true;

			await this.client.startScan({ model: 'H' });
			await this.client.wait(scanDuration);
			this.client.stopScan();

			this.isScanningForMetadata = false;
			this.log.info(
				`Finished scanning for device metadata (address ${address})`,
			);
		} catch (e) {
			logSwitchbotClientError(this.log, e);
		}
	};

	private handleScannedAdvertisdementData = (data: Ad) => {
		const adaptedData = adaptSwitchBotAdvertisdementData(data);
		if (!adaptedData) {
			this.log.error('Data scanned is not valid');
			return;
		}

		const isAlreadyCached = this.metaDataCache.has(adaptedData.address);
		if (isAlreadyCached) {
			return;
		}

		this.log.info(
			`Found device metadata during scan. setting on cache. (address ${adaptedData.address})`,
		);
		this.metaDataCache.set(adaptedData.address, data);
	};

	private getMetadataFromCache = (address: string) => {
		const metaData = this.metaDataCache.get(address) as SwitchbotMetadata;
		return metaData;
	};
}
