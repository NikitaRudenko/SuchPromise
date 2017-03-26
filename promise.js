class SuchPromise {
	/**
	 * Конструктор
	 * @param {Function} asyncFn Функция, которая будет выполнена асинхронно
	 * @returns {SuchPromise}
	 */
	constructor(asyncFn) {
		this._asyncFn = asyncFn;
		this._state = 'pending';
		this._result = null;
		this._onFullfilled = [];
		this._onRejected = [];
		this._run();

		return this;
	}

	/**
	 * Ожидает перехода всех переданных промисов в состояние fullfilled,
	 * затем переходит в состояние fullfilled.
	 * @param {Object[]} promises Массив промисов
	 * @returns {SuchPromise}
	 * @public
	 */
	static all(promises) {
		const allPromise = new SuchPromise((res, rej) => {
			let resolvedCount = 0;
			const resolvedResults = [];

			const checker = setInterval(() => {
				promises.map((promise) => {
					const resolved = promise._state === 'fullfilled';
					const rejected = promise._state === 'rejected';
					
					if (resolved) {
						const result = promise._result;
						resolvedResults.push(result);
						resolvedCount++;

						if (resolvedCount === promises.length) {
							clearInterval(checker);
							res(resolvedResults);
						}
					} else if (rejected) {
						clearInterval(checker);
						const error = promise._result;
						rej(error);
					}
				});
			});
		});

		return allPromise;
	}

	/**
	 * Добавляет обработчик в onFullfilled
	 * @param {Function} callback Обработчик при state === fullfilled.
	 * @returns {SuchPromise}
	 * @public
	 */
	then(callback) {
		this._onFullfilled.push(callback);
		this._checkReady('fullfilled');
		return this;
	}

	/**
	 * Добавляет обработчик в onRejected
	 * @param {Function} callback Обработчик при state === rejected.
	 * @returns {SuchPromise}
	 * @public
	 */
	catch(callback) {
		this._onRejected.push(callback);
		this._checkReady('rejected');
		return this;
	}

	/**
	 * Завершает работу асинхронной функции.
	 * Переводит промис в состояние 'fullfilled'.
	 * @param {Object|String|Number|SuchPromise} result
	 * Результат работы асинхронной функции.
	 * @returns {*}
	 * @public
	 */
	resolve(result) {
		return this._finish('fullfilled', result);
	}

	/**
	 * Завершает работу асинхронной функции.
	 * Переводит промис в состояние 'rejected'.
	 * @param {Object|String|Number|SuchPromise} error
	 * Ошибка асинхронной функции
	 * @returns {*}
	 * @public
	 */
	reject(error) {
		return this._finish('rejected', error);
	}

	/**
	 * Завершает работу промиса, если state !== 'pending'.
	 * @param {String} state Состояние промиса.
	 * @private
	 */
	_checkReady(state) {
		const isReady = this._state === state;
		isReady && this._finish(state, this._result);
	}

	/**
	 * Завершает работу промиса
	 * @param {String} newState Новое состояние промиса.
	 * @param {Object|String|Number|SuchPromise} result Результат асинхронной функции.
	 * @returns {*}
	 * @private
	 * 
	 * @todo переделать
	 */
	_finish(newState, result) {
		this._state = newState;
		this._result = result;
		let callbackRes = this._runCallback(result);
		const isError = newState === 'rejected';

		if (isError || !callbackRes) return;
		
		const isNotSuchPromise = typeof callbackRes !== 'object';
		const hasChain = this._onFullfilled.length > 0;

		if (hasChain) {
			if (isNotSuchPromise) {
				callbackRes = this._promisificate(callbackRes);
			}

			return this._getHandlers(callbackRes);
		}
		return;
	}

	/**
	 * Вызов функции - обработчика в зависимости от состояния промиса.
	 * @param {Object|String|Number|SuchPromise} result Результат асинхронной функции.
	 * @returns {*}
	 * @private
	 */
	_runCallback(result) {
		const callback = this._shiftCallback(this._state);
		return callback ? callback(result) : false;
	}

	/**
	 * Выбирает из очереди нужный обработчик
	 * @param {String} state Состояние промиса
	 * @returns {Function}
	 * @private
	 */
	_shiftCallback(state) {
		if (state === 'fullfilled') {
			return this._onFullfilled.shift();
		} else if (state === 'rejected') {
			return this._onRejected.shift();
		} 
	}

	/**
	 * Оборачивает результат в промис
	 * @param {*} result Результат функции обработчика
	 * @returns {SuchPromise}
	 * @private
	 */
	_promisificate(result) {
		return new SuchPromise((res) => res(result));
	}

	/**
	 * Присваивает объекту промиса все обработчики
	 * из текущего объекта промиса
	 * @param {SuchPromise} promise Объект промиса
	 * @returns {SuchPromise}
	 * @private
	 */
	_getHandlers(promise) {
		promise._onFullfilled = this._onFullfilled;
		promise._onRejected = this._onRejected;

		return promise;
	}

	/**
	 * Запускает асинхронную функцию
	 * @private
	 */
	_run() {
		setTimeout(() => {
			const res = this.resolve.bind(this);
			const rej = this.reject.bind(this);
			this._asyncFn(res, rej);
		}, 0);
	}
}
