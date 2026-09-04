# Stripe Price Points - Quick Start Guide

**Status**: Ready to Execute  
**Estimated Time**: 30-45 minutes  
**Last Updated**: January 2025

---

## 🚀 Quick Start (3 Steps)

### Step 1: Verify Setup (5 minutes)
```bash
cd server
pnpm stripe:verify
```

This will check:
- ✅ Stripe environment variables
- ✅ Database pricing records
- ✅ Pricing amount matches
- ✅ Stripe price IDs in database
- ✅ Stripe API connection

**If verification fails**: Follow the error messages to fix issues first.

---

### Step 2: Create Stripe Products & Prices (10 minutes)
```bash
# From project root
export STRIPE_SECRET_KEY=sk_test_your_key_here  # or sk_live_ for production
node scripts/setup-stripe-products.js
```

**Expected Output**:
```
🚀 Setting up Stripe products for Vssyl...
🔑 Using Stripe key: sk_test_xxxx...
🌍 Environment: TEST

📦 Creating product: Vssyl Pro Plan
✅ Product created: prod_pro
  💰 Creating price: Pro Monthly
  ✅ Price created: price_pro_monthly ($29.00/month)
  💰 Creating price: Pro Yearly
  ✅ Price created: price_pro_yearly ($290.00/year)

... (similar for other tiers)

🎉 All Stripe products and prices created successfully!
```

**Note**: If products/prices already exist, you'll see warnings - that's OK!

---

### Step 3: Sync Stripe Prices to Database (5 minutes)
```bash
cd server
pnpm stripe:sync
```

**Expected Output**:
```
🔄 Syncing Stripe prices to database...

✅ Synced pro/monthly: price_pro_monthly
✅ Synced pro/yearly: price_pro_yearly
✅ Synced business_basic/monthly: price_business_basic_monthly
✅ Synced business_basic/yearly: price_business_basic_yearly
✅ Synced business_advanced/monthly: price_business_advanced_monthly
✅ Synced business_advanced/yearly: price_business_advanced_yearly
✅ Synced enterprise/monthly: price_enterprise_monthly
✅ Synced enterprise/yearly: price_enterprise_yearly

📊 Sync Summary:
   ✅ Synced: 8
   ⏭️  Skipped: 0
   ❌ Errors: 0
   📦 Total: 8

🎉 Sync completed! 8 price(s) synced to database.
```

---

## ✅ Verification

After completing all steps, verify everything is working:

```bash
# Run verification again
cd server
pnpm stripe:verify
```

All checks should now pass! ✅

---

## 🔍 Troubleshooting

### Issue: "No pricing records found"
**Solution**: Run the seed script first:
```bash
cd server
pnpm seed:pricing
```

### Issue: "Product already exists"
**Solution**: This is expected if you've run the script before. The script will skip existing products and create missing prices.

### Issue: "Price mismatch"
**Solution**: Check that database pricing matches Stripe pricing. Update either database or Stripe to match.

### Issue: "No Stripe price found"
**Solution**: 
1. Verify products were created in Stripe Dashboard
2. Check product ID mapping in sync script
3. Verify prices exist for each product

---

## 📋 What Gets Created

### Stripe Products (4):
- `prod_pro` - Vssyl Pro Plan
- `prod_business_basic` - Vssyl Business Basic
- `prod_business_advanced` - Vssyl Business Advanced
- `prod_enterprise` - Vssyl Enterprise Plan

### Stripe Prices (8):
- `price_pro_monthly` - $29.00/month
- `price_pro_yearly` - $290.00/year
- `price_business_basic_monthly` - $49.99/month
- `price_business_basic_yearly` - $499.99/year
- `price_business_advanced_monthly` - $69.99/month
- `price_business_advanced_yearly` - $699.99/year
- `price_enterprise_monthly` - $129.99/month
- `price_enterprise_yearly` - $1,299.99/year

### Database Updates:
- All 8 pricing records will have `stripePriceId` populated
- Ready for subscription creation

---

## 🎯 Next Steps

After completing the quick start:

1. **Test Subscription Creation**: Create a test subscription to verify it uses the correct Stripe price ID
2. **Test Checkout Flow**: Test the checkout session creation
3. **Verify in Stripe Dashboard**: Check that subscriptions appear correctly
4. **Set Up Webhooks**: Configure Stripe webhooks for subscription events

---

## 📚 Related Documentation

- **Full Implementation Plan**: `./STRIPE_PRICE_POINTS_IMPLEMENTATION_PLAN.md`
- **Billing System Plan**: `docs/archive/stripe-merged-2026/BILLING_PAYMENT_IMPLEMENTATION_PLAN.md`

---

## 🆘 Need Help?

If you encounter issues:
1. Check the verification script output for specific errors
2. Review the troubleshooting section above
3. Check Stripe Dashboard to verify products/prices exist
4. Review the full implementation plan for detailed steps

---

**Ready to start?** Run Step 1 above! 🚀

