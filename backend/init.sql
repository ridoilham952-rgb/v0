-- Initialize Somnia DevLab database schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for storing contract events
CREATE TABLE contract_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    log_index INTEGER NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing transaction logs for replay
CREATE TABLE transaction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_hash VARCHAR(66) NOT NULL UNIQUE,
    block_number BIGINT NOT NULL,
    block_hash VARCHAR(66) NOT NULL,
    from_address VARCHAR(42) NOT NULL,
    to_address VARCHAR(42),
    value VARCHAR(78) NOT NULL,
    gas_used BIGINT NOT NULL,
    gas_price VARCHAR(78) NOT NULL,
    status INTEGER NOT NULL,
    contract_address VARCHAR(42),
    logs JSONB NOT NULL DEFAULT '[]',
    state_diff JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing gas profiling data
CREATE TABLE gas_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_address VARCHAR(42) NOT NULL,
    function_name VARCHAR(100) NOT NULL,
    gas_used BIGINT NOT NULL,
    execution_time_ms INTEGER,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing stress test results
CREATE TABLE stress_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(100) NOT NULL,
    total_transactions INTEGER NOT NULL,
    successful_transactions INTEGER NOT NULL,
    failed_transactions INTEGER NOT NULL,
    average_tps DECIMAL(10,2) NOT NULL,
    average_latency_ms INTEGER NOT NULL,
    max_latency_ms INTEGER NOT NULL,
    test_duration_seconds INTEGER NOT NULL,
    test_config JSONB NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing real-time metrics
CREATE TABLE realtime_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(50) NOT NULL, -- 'tps', 'error_rate', 'latency', 'gas_usage'
    value DECIMAL(15,6) NOT NULL,
    block_number BIGINT,
    contract_address VARCHAR(42),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contract_events_address_block ON contract_events(contract_address, block_number);
CREATE INDEX idx_contract_events_timestamp ON contract_events(timestamp);
CREATE INDEX idx_transaction_logs_block ON transaction_logs(block_number);
CREATE INDEX idx_transaction_logs_timestamp ON transaction_logs(timestamp);
CREATE INDEX idx_gas_profiles_contract_function ON gas_profiles(contract_address, function_name);
CREATE INDEX idx_realtime_metrics_type_timestamp ON realtime_metrics(metric_type, timestamp);

-- Create a view for recent activity
CREATE VIEW recent_activity AS
SELECT 
    'event' as type,
    contract_address,
    event_name as name,
    block_number,
    timestamp
FROM contract_events
WHERE timestamp > NOW() - INTERVAL '1 hour'
UNION ALL
SELECT 
    'transaction' as type,
    COALESCE(to_address, contract_address) as contract_address,
    'transaction' as name,
    block_number,
    timestamp
FROM transaction_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
