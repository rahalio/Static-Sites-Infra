#!/usr/bin/env bash
set -euo pipefail

STACK="${STACK:-StaticSiteStack}"
REGION="${REGION:-us-east-1}"
PROFILE="${PROFILE:-prod}"
OUTPUT_DIR="${OUTPUT_DIR:-site-dist}"

read_output () {
  aws cloudformation describe-stacks \
    --profile "$PROFILE" \
    --region "$REGION" \
    --stack-name "$STACK" \
    --query "Stacks[0].Outputs[?OutputKey=='$1'].OutputValue" \
    --output text
}

BUCKET="$(read_output BucketName)"
DIST_ID="$(read_output DistributionId)"

if [[ -z "$BUCKET" || -z "$DIST_ID" ]]; then
  echo "Could not read outputs from stack '$STACK' in $REGION (profile $PROFILE)."
  exit 1
fi

cat > .env <<EOF
S3_BUCKET_NAME=$BUCKET
CLOUDFRONT_DISTRIBUTION_ID=$DIST_ID
AWS_REGION=$REGION
OUTPUT_DIR=$OUTPUT_DIR
EOF

echo "Wrote .env:"
cat .env
