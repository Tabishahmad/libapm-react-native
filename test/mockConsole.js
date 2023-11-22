global.console = Object.assign(Object.assign({}, console), { log: jest.fn(), debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() });
