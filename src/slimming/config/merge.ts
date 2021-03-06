import { config } from './config';

const mergeUserVal = (v: TConfigItem, _v: unknown): TConfigItem => {
	if (Array.isArray(v)) {
		// 数组只要字符串项
		if (Array.isArray(_v)) {
			return _v.filter(s => typeof s === 'string');
		}
	} else if (typeof v === typeof _v) {
		if (typeof _v === 'number') {
			// 数值项要忽略 NaN、Infinity 和负数，并下取整
			// 数值精度最多保留 8 位
			if (_v >= 0 && _v !== Infinity) {
				return Math.floor(_v);
			}
		} else {
			return _v as boolean;
		}
	}
	return v;
};

export const mergeConfig = (userConfig: unknown) => {
	const finalConfig: IFinalConfig = {};
	// 首先把默认规则深拷贝合并过来
	for (const [key, val] of Object.entries(config)) {
		finalConfig[key] = [val[0]];
		if (val[1]) {
			const option: IConfigOption = { keyOrder: val[1].keyOrder };
			for (const [k, v] of Object.entries(val[1])) {
				option[k] = Array.isArray(v) ? v.slice() : v;
			}
			finalConfig[key][1] = option;
		}
	}
	if (typeof userConfig === 'object' && userConfig) {
		for (const [key, val] of Object.entries(userConfig)) {
			// 只合并存在的值
			if (finalConfig.hasOwnProperty(key)) {
				const conf = finalConfig[key];
				// 布尔值直接设置开关位置
				if (typeof val === 'boolean') {
					conf[0] = val;
				} else if (Array.isArray(val) && typeof val[0] === 'boolean') {
					// 如果开关位置不是布尔值，后续直接抛弃处理
					conf[0] = val[0];
					// 默认配置如果没有 option 则不必再验证，如果没有打开配置项，后续也不必再验证
					if (conf[0] && conf[1]) {
						if (typeof val[1] === 'object' && val[1] && !Array.isArray(val[1])) {
							// 如果拿到的是 IConfigOption 类型
							for (const [k, v] of Object.entries(val[1] as object)) {
								if (k !== 'keyOrder' && conf[1].hasOwnProperty(k)) {
									conf[1][k] = mergeUserVal(conf[1][k], v);
								}
							}
						} else {
							for (const k of Object.keys(conf[1])) {
								if (k !== 'keyOrder') {
									const index = (conf[1].keyOrder as string[]).indexOf(k) + 1;
									conf[1][k] = mergeUserVal(conf[1][k], val[index]);
								}
							}
						}
					}
				}
			}
		}
	}
	return finalConfig;
};
