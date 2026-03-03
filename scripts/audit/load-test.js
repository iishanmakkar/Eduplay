const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';
const CONCURRENCY = 50;
const DURATION_MS = 10000; // 10 seconds

async function runLoadTest() {
    console.log(`🚀 Starting Load Test: ${CONCURRENCY} concurrent users for ${DURATION_MS}ms`);

    const startTime = Date.now();
    let completedRequests = 0;
    let failedRequests = 0;
    let totalLatency = 0;

    const workers = [];

    for (let i = 0; i < CONCURRENCY; i++) {
        workers.push(
            (async () => {
                while (Date.now() - startTime < DURATION_MS) {
                    const reqStart = performance.now();
                    try {
                        // Mix of public pages and API hits
                        const endpoints = ['/', '/auth/signin', '/api/games/save-result']; // Expected 404/405/401 for some
                        const target = endpoints[Math.floor(Math.random() * endpoints.length)];

                        const res = await fetch(`${BASE_URL}${target}`, {
                            method: target.includes('save-result') ? 'POST' : 'GET'
                        });

                        // We count 4xx as "success" in terms of server handling it (not crashing)
                        // 5xx is a failure
                        if (res.status >= 500) {
                            failedRequests++;
                        } else {
                            completedRequests++;
                        }
                    } catch (e) {
                        console.error('Request failed:', e.message);
                        failedRequests++;
                    }
                    const reqEnd = performance.now();
                    totalLatency += (reqEnd - reqStart);

                    // Small verify to not melt local machine completely
                    await new Promise(r => setTimeout(r, 100));
                }
            })()
        );
    }

    await Promise.all(workers);

    const durationSec = (Date.now() - startTime) / 1000;
    const rps = completedRequests / durationSec;
    const avgLatency = totalLatency / (completedRequests + failedRequests);

    console.log('\n📊 Load Test Results:');
    console.log(`Total Requests: ${completedRequests + failedRequests}`);
    console.log(`Successful (Non-500): ${completedRequests}`);
    console.log(`Failed (500+ or net error): ${failedRequests}`);
    console.log(`RPS: ${rps.toFixed(2)}`);
    console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`); // This might be high if simple fetch

    // Score generation for report
    const score = failedRequests === 0 && rps > 10 ? 100 : Math.max(0, 100 - (failedRequests * 5));
    console.log(`Load Scalability Score: ${score}`);
}

runLoadTest();
