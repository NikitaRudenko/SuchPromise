console.log('start');

const asyncAction = new SuchPromise((res, rej) => {
	setTimeout(() => {
		console.log('make async actions');
		res('finish req');
	}, 1000);
}).then((result) => {
	console.log('Middle: ', result);
	result += ' + 1';
	let a = new SuchPromise((res, rej) => {
		console.log('inside');
		res(result);
	});

	return a;
}).then((result) => {
	console.log('Result: ', result);
}).catch((err) => {
	console.log('Error: ', err);
});


console.log('continue');

console.log('end');

function createPromisesArr(count) {
    const promises = [];
    for (let i = 0;i < count; i++) {
        const promise = new SuchPromise((res, rej) => {
            setTimeout(() => {
                res(`SuchPromise #${i} RESOLVED`);
            }, 1000);
        });
        promises.push(promise);
    }
    return promises;
}

const all = createPromisesArr(10);

SuchPromise.all(all)
    .then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(err);
    });

// var a = new SuchPromise((res, rej) => {
//     setTimeout(() => {
//         console.log('resolvedD');
//         rej('resolved NOT');
//     }, 300);
// })

// setTimeout(()=> {
//     a.then(res => {
//         console.log(res);
//     })
//     .catch(function(err) {
//         console.log(err);
//     });
// }, 1000)