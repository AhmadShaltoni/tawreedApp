import Button from "@/src/components/ui/Button";
import EmptyState from "@/src/components/ui/EmptyState";
import Loader from "@/src/components/ui/Loader";
import {
  BorderRadius,
  Colors,
  FontSize,
  Shadows,
  Spacing,
} from "@/src/constants/theme";
import { useAuthGuard } from "@/src/hooks/useAuthGuard";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  clearCart,
  fetchCart,
  removeFromCartAsync,
  updateCartItemAsync,
} from "@/src/store/slices/cart.slice";
import type { CartItem } from "@/src/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CartScreen() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, requireAuth } = useAuthGuard();
  const { items, loading, updating, error } = useAppSelector(
    (state) => state.cart,
  );

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [dispatch, isAuthenticated]);

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.product.discountPrice ?? item.product.price;
      return sum + price * item.quantity;
    }, 0);
    return { subtotal, itemCount: items.length };
  }, [items]);

  const handleIncrement = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        if (item.quantity < item.product.stock) {
          dispatch(
            updateCartItemAsync({
              productId: item.product.id,
              quantity: item.quantity + 1,
            }),
          );
        }
      });
    },
    [dispatch, requireAuth],
  );

  const handleDecrement = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        if (item.quantity > item.product.minOrder) {
          dispatch(
            updateCartItemAsync({
              productId: item.product.id,
              quantity: item.quantity - 1,
            }),
          );
        }
      });
    },
    [dispatch, requireAuth],
  );

  const handleRemove = useCallback(
    (item: CartItem) => {
      requireAuth(() => {
        Alert.alert(
          t("cart.removeItem"),
          t("cart.removeItemMessage", { name: item.product.name }),
          [
            { text: t("common.cancel"), style: "cancel" },
            {
              text: t("common.remove"),
              style: "destructive",
              onPress: () => dispatch(removeFromCartAsync(item.product.id)),
            },
          ],
        );
      });
    },
    [dispatch, t, requireAuth],
  );

  const handleClearCart = useCallback(() => {
    requireAuth(() => {
      Alert.alert(t("cart.clearCartTitle"), t("cart.clearCartMessage"), [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.clear"),
          style: "destructive",
          onPress: () => dispatch(clearCart()),
        },
      ]);
    });
  }, [dispatch, t, requireAuth]);

  const renderItem = useCallback(
    ({ item }: { item: CartItem }) => {
      const unitPrice = item.product.discountPrice ?? item.product.price;
      const lineTotal = unitPrice * item.quantity;
      const isUpdating = updating[item.product.id];

      return (
        <View style={[styles.cartItem, isUpdating && styles.itemUpdating]}>
          <Image
            source={
              item.product.images?.[0]
                ? { uri: item.product.images[0] }
                : require("@/assets/images/icon.png")
            }
            style={styles.itemImage}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.product.name}
            </Text>
            <Text style={styles.itemPrice}>
              {unitPrice.toFixed(2)} {t("common.currency")} /{" "}
              {item.product.unit}
            </Text>
            <View style={styles.itemActions}>
              <View style={styles.qtySelector}>
                <Pressable
                  onPress={() => handleDecrement(item)}
                  style={styles.qtyBtn}
                  disabled={
                    item.quantity <= item.product.minOrder || isUpdating
                  }
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={
                      item.quantity <= item.product.minOrder
                        ? Colors.textLight
                        : Colors.primary
                    }
                  />
                </Pressable>
                <Text style={styles.qtyText}>{item.quantity}</Text>
                <Pressable
                  onPress={() => handleIncrement(item)}
                  style={styles.qtyBtn}
                  disabled={item.quantity >= item.product.stock || isUpdating}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={
                      item.quantity >= item.product.stock
                        ? Colors.textLight
                        : Colors.primary
                    }
                  />
                </Pressable>
              </View>
              <Text style={styles.lineTotal}>
                {lineTotal.toFixed(2)} {t("common.currency")}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => handleRemove(item)}
            style={styles.removeBtn}
            hitSlop={8}
            disabled={isUpdating}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </Pressable>
        </View>
      );
    },
    [updating, handleIncrement, handleDecrement, handleRemove, t],
  );

  if (loading && items.length === 0) {
    return <Loader />;
  }

  if (items.length === 0) {
    if (!isAuthenticated && items.length === 0) {
      return (
        <EmptyState
          icon="cart-outline"
          title={t("cart.empty")}
          message={t("cart.emptyMessage")}
          actionLabel={t("auth.goToLogin")}
          onAction={() => router.push("/(auth)/login")}
        />
      );
    }

    return (
      <EmptyState
        icon="cart-outline"
        title={t("cart.empty")}
        message={t("cart.emptyMessage")}
        actionLabel={t("cart.browseProducts")}
        onAction={() => router.push("/products")}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>
          {totals.itemCount} item{totals.itemCount !== 1 ? "s" : ""}
        </Text>
        <Pressable onPress={handleClearCart} hitSlop={8}>
          <Text style={styles.clearText}>{t("cart.clearAll")}</Text>
        </Pressable>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.product.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />

      {/* Bottom summary */}
      <View style={styles.bottomBar}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t("cart.subtotal")}</Text>
          <Text style={styles.totalValue}>
            {totals.subtotal.toFixed(2)} {t("common.currency")}
          </Text>
        </View>
        <Button
          title={t("cart.proceedToCheckout")}
          onPress={() => requireAuth(() => router.push("/checkout"))}
          variant="accent"
          style={styles.checkoutBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  headerText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.error,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    backgroundColor: "#fef2f2",
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    flex: 1,
  },
  listContent: {
    padding: Spacing.xxl,
    paddingBottom: Spacing.md,
  },
  cartItem: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  itemUpdating: {
    opacity: 0.6,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.inputBackground,
  },
  itemInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 18,
  },
  itemPrice: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  qtySelector: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.inputBackground,
  },
  qtyBtn: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
  },
  qtyText: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 28,
    textAlign: "center",
  },
  lineTotal: {
    fontSize: FontSize.sm,
    fontWeight: "700",
    color: Colors.primary,
  },
  removeBtn: {
    paddingLeft: Spacing.sm,
    justifyContent: "center",
  },
  bottomBar: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  totalLabel: {
    fontSize: FontSize.md,
    fontWeight: "600",
    color: Colors.text,
  },
  totalValue: {
    fontSize: FontSize.xl,
    fontWeight: "800",
    color: Colors.primary,
  },
  checkoutBtn: {
    width: "100%",
  },
});
