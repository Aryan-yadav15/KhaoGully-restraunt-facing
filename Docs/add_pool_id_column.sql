-- Add pool_id column to fetched_orders table
ALTER TABLE public.fetched_orders 
ADD COLUMN pool_id TEXT NULL;

-- Add sent_for_delivery column to track if order was dispatched
ALTER TABLE public.fetched_orders 
ADD COLUMN sent_for_delivery BOOLEAN NOT NULL DEFAULT FALSE;

-- Create an index on pool_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_fetched_orders_pool_id 
ON public.fetched_orders USING btree (pool_id) 
TABLESPACE pg_default;

-- Create an index on sent_for_delivery for filtering active orders
CREATE INDEX IF NOT EXISTS idx_fetched_orders_sent_for_delivery 
ON public.fetched_orders USING btree (sent_for_delivery) 
TABLESPACE pg_default;

-- Update order_responses table constraint to allow 'auto_rejected' status
ALTER TABLE public.order_responses 
DROP CONSTRAINT IF EXISTS order_responses_overall_status_check;

ALTER TABLE public.order_responses 
ADD CONSTRAINT order_responses_overall_status_check 
CHECK (
  overall_status = ANY (
    ARRAY[
      'accepted'::text,
      'partially_accepted'::text,
      'rejected'::text,
      'auto_rejected'::text
    ]
  )
);

-- Optional: Add comments to document the columns
COMMENT ON COLUMN public.fetched_orders.pool_id IS 'Identifier for the batch/pool of orders fetched together from external service';
COMMENT ON COLUMN public.fetched_orders.sent_for_delivery IS 'Indicates whether the order has been sent for delivery (true) or is still active/pending (false)';
