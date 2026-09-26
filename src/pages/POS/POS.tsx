import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Volume2,
  X,
  XCircle,
} from "lucide-react";

import {
  createOrder,
  fetchProducts,
  fetchShops,
} from "../../services/api";

interface Shop {
  id: number;
  name: string;
  location: string;
  phone?: string;
  status?: string;
  is_open?: boolean;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  shop_id: number;
  image?: string;
  is_active: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CompletedOrder {
  id: number;
  shop_id: number;
  total: number;
  payment_method: string;
  created_at: string;
  items: {
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
}

const categoryImages: Record<string, string> = {
  Idly: "/menu/idly.jpg",
  Dosa: "/menu/dosa.jpg",
  Vada: "/menu/vada.jpg",
  Puri: "/menu/puri.jpg",
  "Non-Veg Tiffins": "/menu/nonveg.jpg",
  "Tea & Coffee": "/menu/tea.jpg",
  "Evening Snacks": "/menu/evening-snacks.jpg",
};

const POS_STYLE = `
  .pos-root {
    --pos-black: #111111;
    --pos-white: #ffffff;
    --pos-border: var(--border, #e5e5e5);
    --pos-muted: var(--text-muted, #777777);
    --pos-secondary: var(--text-secondary, #555555);
    --pos-success: var(--success, #16a34a);
    --pos-success-bg: var(--success-bg, #ecfdf3);
    --pos-danger: var(--danger, #dc2626);
    --pos-danger-bg: var(--danger-bg, #fef2f2);
  }

  .pos-root *,
  .pos-root *::before,
  .pos-root *::after {
    box-sizing: border-box;
  }

  .pos-refresh-button,
  .pos-clear-button,
  .pos-icon-button,
  .pos-payment-button,
  .pos-secondary-button,
  .pos-primary-button,
  .pos-category-button,
  .pos-product-card {
    font: inherit;
  }

  .pos-refresh-button,
  .pos-clear-button,
  .pos-icon-button,
  .pos-payment-button,
  .pos-secondary-button,
  .pos-primary-button,
  .pos-category-button,
  .pos-product-card {
    -webkit-tap-highlight-color: transparent;
  }

  .pos-refresh-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 40px;
    padding: 0 14px;
    border: 1px solid var(--pos-border);
    border-radius: 9px;
    background: var(--pos-white);
    color: var(--pos-secondary);
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: 0.16s ease;
  }

  .pos-refresh-button:hover:not(:disabled) {
    border-color: #bdbdbd;
    background: #fafafa;
  }

  .pos-refresh-button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .pos-shop-panel {
    margin-bottom: 18px;
    padding: 14px 18px;
  }

  .pos-shop-panel-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    flex-wrap: wrap;
  }

  .pos-shop-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .pos-shop-icon {
    width: 42px;
    height: 42px;
    flex: 0 0 42px;
    display: grid;
    place-items: center;
    border-radius: 11px;
    background: var(--pos-black);
    color: white;
  }

  .pos-shop-details {
    min-width: 0;
  }

  .pos-shop-name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 750;
  }

  .pos-shop-location {
    margin-top: 3px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--pos-muted);
    font-size: 12px;
  }

  .pos-shop-selector {
    width: min(300px, 100%);
    flex: 1 1 230px;
  }

  .pos-shop-label,
  .pos-payment-label {
    display: block;
    margin-bottom: 7px;
    color: var(--pos-secondary);
    font-size: 11px;
    font-weight: 750;
    letter-spacing: 0.45px;
    text-transform: uppercase;
  }

  .pos-select-wrap {
    position: relative;
  }

  .pos-select {
    width: 100%;
    height: 42px;
    padding: 0 38px 0 12px;
    border: 1px solid var(--pos-border);
    border-radius: 9px;
    outline: none;
    background: white;
    color: var(--text, #171717);
    font-size: 13px;
    cursor: pointer;
    appearance: none;
  }

  .pos-select:focus {
    border-color: #999999;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
  }

  .pos-select-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    pointer-events: none;
    transform: translateY(-50%);
    color: var(--pos-secondary);
  }

  .pos-alert {
    display: flex;
    align-items: center;
    gap: 9px;
    min-height: 46px;
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 600;
  }

  .pos-alert-error {
    border-color: #fecaca;
    background: var(--pos-danger-bg);
    color: var(--pos-danger);
  }

  .pos-alert-success {
    border-color: #bbf7d0;
    background: var(--pos-success-bg);
    color: var(--pos-success);
  }

  .pos-alert-close {
    width: 28px;
    height: 28px;
    margin-left: auto;
    display: grid;
    flex: 0 0 28px;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }

  .pos-alert-close:hover {
    background: rgba(0, 0, 0, 0.05);
  }

  .pos-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 390px;
    gap: 20px;
    align-items: start;
  }

  .pos-menu-panel {
    padding: 14px;
  }

  .pos-search-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pos-search-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .pos-search-icon {
    position: absolute;
    left: 13px;
    top: 50%;
    pointer-events: none;
    transform: translateY(-50%);
    color: var(--pos-muted);
  }

  .pos-search-input {
    width: 100%;
    height: 46px;
    padding: 0 40px 0 42px;
    border: 1px solid var(--pos-border);
    border-radius: 10px;
    outline: none;
    background: white;
    color: var(--text, #171717);
    font-size: 13px;
  }

  .pos-search-input:focus {
    border-color: #999999;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
  }

  .pos-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 7px;
    background: #f2f2f2;
    color: #666666;
    cursor: pointer;
    transform: translateY(-50%);
  }

  .pos-item-count {
    height: 46px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 13px;
    border: 1px solid var(--pos-border);
    border-radius: 10px;
    background: #fafafa;
    color: var(--pos-secondary);
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
  }

  .pos-category-scroll {
    display: flex;
    gap: 7px;
    overflow-x: auto;
    padding: 13px 1px 1px;
    scrollbar-width: none;
  }

  .pos-category-scroll::-webkit-scrollbar {
    display: none;
  }

  .pos-category-button {
    min-height: 36px;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 0 12px;
    border: 1px solid var(--pos-border);
    border-radius: 9px;
    background: white;
    color: var(--pos-secondary);
    font-size: 12px;
    font-weight: 650;
    white-space: nowrap;
    cursor: pointer;
    transition: 0.15s ease;
  }

  .pos-category-button:hover {
    border-color: #b5b5b5;
    background: #fafafa;
  }

  .pos-category-button.active {
    border-color: var(--pos-black);
    background: var(--pos-black);
    color: white;
  }

  .pos-category-count {
    opacity: 0.7;
    font-size: 10px;
  }

  .pos-product-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 18px 2px 12px;
  }

  .pos-product-heading-title {
    font-size: 15px;
    font-weight: 750;
  }

  .pos-product-heading-count {
    margin-left: 8px;
    color: var(--pos-muted);
    font-size: 12px;
  }

  .pos-closed-note {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--pos-danger);
    font-size: 12px;
    font-weight: 650;
  }

  .pos-products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
    gap: 14px;
  }

  .pos-product-card {
    position: relative;
    overflow: hidden;
    padding: 0;
    border: 1px solid var(--pos-border);
    border-radius: 14px;
    outline: none;
    background: white;
    color: var(--text, #171717);
    text-align: left;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    transition:
      transform 0.16s ease,
      box-shadow 0.16s ease,
      border-color 0.16s ease;
  }

  .pos-product-card:hover:not(:disabled) {
    border-color: #bdbdbd;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.09);
    transform: translateY(-2px);
  }

  .pos-product-card.selected {
    border: 2px solid var(--pos-black);
    box-shadow: 0 7px 20px rgba(0, 0, 0, 0.10);
  }

  .pos-product-card:focus-visible {
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.14);
  }

  .pos-product-card:disabled {
    cursor: not-allowed;
    opacity: 0.52;
  }

  .pos-product-image-wrap {
    position: relative;
    overflow: hidden;
    background: #f1f1f1;
  }

  .pos-product-image {
    width: 100%;
    height: 135px;
    display: block;
    object-fit: cover;
    transition: transform 0.25s ease;
  }

  .pos-product-card:hover:not(:disabled) .pos-product-image {
    transform: scale(1.025);
  }

  .pos-product-added {
    position: absolute;
    left: 9px;
    top: 9px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    background: rgba(17, 17, 17, 0.92);
    color: white;
    font-size: 10px;
    font-weight: 750;
  }

  .pos-product-quantity {
    position: absolute;
    right: 9px;
    top: 9px;
    min-width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    padding: 0 8px;
    border-radius: 999px;
    background: white;
    color: #111;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.20);
  }

  .pos-product-info {
    padding: 12px;
  }

  .pos-product-name {
    min-height: 38px;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.35;
  }

  .pos-product-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: 9px;
  }

  .pos-product-price {
    color: #111;
    font-size: 15px;
    font-weight: 800;
  }

  .pos-product-hint {
    color: var(--pos-muted);
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
  }

  .pos-product-card.selected .pos-product-hint {
    color: #111;
    font-weight: 700;
  }

  .pos-state-panel {
    padding: 0;
  }

  .pos-state {
    min-height: 260px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 35px 20px;
    color: var(--pos-muted);
    text-align: center;
  }

  .pos-state-icon {
    width: 66px;
    height: 66px;
    display: grid;
    place-items: center;
    margin-bottom: 12px;
    border-radius: 50%;
    background: #f5f5f5;
  }

  .pos-state h3 {
    margin: 0 0 5px;
    color: var(--text, #171717);
    font-size: 15px;
  }

  .pos-state p {
    max-width: 330px;
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
  }

  .pos-clear-filters {
    min-height: 38px;
    margin-top: 10px;
    padding: 0 13px;
    border: 1px solid var(--pos-border);
    border-radius: 8px;
    background: white;
    color: var(--pos-secondary);
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
  }

  .pos-bill-panel {
    position: sticky;
    top: 88px;
    overflow: hidden;
    padding: 0;
  }

  .pos-bill-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 17px 18px;
    border-bottom: 1px solid var(--pos-border);
    background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  }

  .pos-bill-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .pos-bill-icon {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    border-radius: 10px;
    background: #111;
    color: white;
  }

  .pos-bill-title {
    margin: 0;
    font-size: 17px;
    font-weight: 750;
  }

  .pos-bill-subtitle {
    display: block;
    margin-top: 2px;
    color: var(--pos-muted);
    font-size: 11px;
  }

  .pos-clear-button {
    width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 8px;
    background: var(--pos-danger-bg);
    color: var(--pos-danger);
    cursor: pointer;
  }

  .pos-clear-button:hover {
    background: #fee2e2;
  }

  .pos-cart-area {
    padding: 15px 18px 0;
  }

  .pos-cart-list {
    display: grid;
    gap: 11px;
    max-height: 390px;
    overflow-y: auto;
    padding-right: 3px;
  }

  .pos-empty-cart {
    padding: 40px 15px 45px;
    color: var(--pos-muted);
    text-align: center;
  }

  .pos-empty-cart-icon {
    width: 64px;
    height: 64px;
    display: grid;
    place-items: center;
    margin: 0 auto;
    border-radius: 50%;
    background: #f5f5f5;
  }

  .pos-empty-cart h3 {
    margin: 13px 0 5px;
    color: var(--text, #171717);
    font-size: 15px;
  }

  .pos-empty-cart p {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
  }

  .pos-cart-item {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
    padding-bottom: 12px;
    border-bottom: 1px solid #eeeeee;
  }

  .pos-cart-item-name {
    display: block;
    font-size: 13px;
    line-height: 1.35;
  }

  .pos-cart-item-price {
    margin-top: 3px;
    color: var(--pos-muted);
    font-size: 11px;
  }

  .pos-cart-controls {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
  }

  .pos-icon-button {
    width: 28px;
    height: 28px;
    display: grid;
    place-items: center;
    border: 0;
    border-radius: 7px;
    cursor: pointer;
  }

  .pos-icon-button.minus {
    background: #f3f3f3;
    color: #222;
  }

  .pos-icon-button.plus {
    background: #111;
    color: white;
  }

  .pos-icon-button.remove {
    background: transparent;
    color: var(--pos-muted);
  }

  .pos-icon-button.remove:hover {
    background: #f5f5f5;
    color: var(--pos-danger);
  }

  .pos-cart-quantity {
    width: 24px;
    text-align: center;
    font-size: 13px;
    font-weight: 750;
  }

  .pos-cart-subtotal {
    padding-top: 1px;
    font-size: 13px;
    font-weight: 750;
    white-space: nowrap;
  }

  .pos-total-area {
    margin-top: 15px;
    padding: 15px 18px;
    border-top: 1px solid var(--pos-border);
    border-bottom: 1px solid var(--pos-border);
    background: #fafafa;
  }

  .pos-total-items {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--pos-secondary);
    font-size: 12px;
  }

  .pos-total-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
  }

  .pos-total-label {
    font-size: 16px;
    font-weight: 750;
  }

  .pos-total-value {
    font-size: 25px;
    font-weight: 800;
    letter-spacing: -0.6px;
    white-space: nowrap;
  }

  .pos-payment-area {
    padding: 15px 18px 18px;
  }

  .pos-payment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }

  .pos-payment-button {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--pos-border);
    border-radius: 9px;
    background: white;
    color: var(--pos-secondary);
    font-size: 12px;
    font-weight: 650;
    cursor: pointer;
    transition: 0.15s ease;
  }

  .pos-payment-button:hover {
    border-color: #aaa;
  }

  .pos-payment-button.active {
    border-color: #111;
    background: #111;
    color: white;
    font-weight: 750;
  }

  .pos-primary-button,
  .pos-secondary-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 750;
    cursor: pointer;
  }

  .pos-primary-button {
    height: 50px;
    margin-top: 12px;
    border: 1px solid #111;
    background: #111;
    color: white;
    box-shadow: 0 5px 14px rgba(0, 0, 0, 0.12);
  }

  .pos-primary-button:hover:not(:disabled) {
    background: #222;
  }

  .pos-primary-button:disabled {
    border-color: #e5e5e5;
    background: #e5e5e5;
    color: #999;
    box-shadow: none;
    cursor: not-allowed;
  }

  .pos-secondary-button {
    height: 42px;
    margin-top: 8px;
    border: 1px solid var(--pos-border);
    background: white;
    color: #333;
  }

  .pos-secondary-button:hover:not(:disabled) {
    background: #fafafa;
    border-color: #bbb;
  }

  .pos-secondary-button:disabled {
    color: #aaa;
    cursor: not-allowed;
  }

  .pos-spin {
    animation: pos-spin 0.8s linear infinite;
  }

  @keyframes pos-spin {
    to {
      transform: rotate(360deg);
    }
  }

  .pos-status-badge {
    display: inline-flex;
    align-items: center;
    min-height: 25px;
    padding: 0 9px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.4px;
  }

  .pos-status-badge.open {
    color: var(--pos-success);
    background: var(--pos-success-bg);
  }

  .pos-status-badge.closed {
    color: var(--pos-danger);
    background: var(--pos-danger-bg);
  }

  .pos-receipt-overlay {
    z-index: 1000;
  }

  .pos-receipt-modal {
    width: min(470px, calc(100vw - 28px));
    max-height: calc(100vh - 28px);
    overflow-y: auto;
    border-radius: 14px;
  }

  .pos-receipt-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px;
  }

  .pos-receipt-action {
    min-height: 38px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    padding: 0 13px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }

  .pos-receipt-action.secondary {
    border: 1px solid var(--pos-border);
    background: white;
    color: #333;
  }

  .pos-receipt-action.primary {
    border: 1px solid #111;
    background: #111;
    color: white;
  }

  .pos-receipt-paper {
    margin: 0 12px 12px;
    padding: 28px 24px;
    background: white;
    color: #111;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .pos-receipt-header {
    text-align: center;
  }

  .pos-receipt-header h1 {
    margin: 0;
    font-size: 23px;
    letter-spacing: -0.4px;
  }

  .pos-receipt-header h2 {
    margin: 7px 0 3px;
    font-size: 16px;
  }

  .pos-receipt-header p {
    margin: 2px 0;
    color: #666;
    font-size: 11px;
  }

  .pos-receipt-divider {
    margin: 18px 0;
    border-top: 1px dashed #bdbdbd;
  }

  .pos-receipt-info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .pos-receipt-info > div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .pos-receipt-info > div:last-child {
    text-align: right;
  }

  .pos-receipt-info span,
  .pos-receipt-payment span {
    color: #777;
    font-size: 10px;
  }

  .pos-receipt-info strong,
  .pos-receipt-payment strong {
    font-size: 11px;
  }

  .pos-receipt-items {
    display: grid;
    gap: 11px;
  }

  .pos-receipt-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 15px;
  }

  .pos-receipt-item > div {
    min-width: 0;
  }

  .pos-receipt-item strong {
    display: block;
    font-size: 12px;
  }

  .pos-receipt-item small {
    display: block;
    margin-top: 3px;
    color: #777;
    font-size: 10px;
  }

  .pos-receipt-total {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .pos-receipt-total span {
    font-size: 13px;
    font-weight: 800;
  }

  .pos-receipt-total strong {
    font-size: 20px;
  }

  .pos-receipt-payment {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-top: 10px;
  }

  .pos-receipt-footer {
    margin-top: 24px;
    text-align: center;
  }

  .pos-receipt-footer p {
    margin: 4px 0;
    color: #777;
    font-size: 10px;
  }

  @media (max-width: 1100px) {
    .pos-main-grid {
      grid-template-columns: minmax(0, 1fr) 350px;
      gap: 16px;
    }

    .pos-products-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    }
  }

  @media (max-width: 900px) {
    .pos-main-grid {
      grid-template-columns: 1fr;
    }

    .pos-bill-panel {
      position: static;
    }

    .pos-cart-list {
      max-height: 320px;
    }
  }

  @media (max-width: 620px) {
    .pos-shop-panel {
      padding: 13px;
    }

    .pos-shop-selector {
      width: 100%;
      flex-basis: 100%;
    }

    .pos-search-row {
      align-items: stretch;
      flex-direction: column;
    }

    .pos-item-count {
      justify-content: center;
    }

    .pos-products-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .pos-product-image {
      height: 115px;
    }

    .pos-product-info {
      padding: 10px;
    }

    .pos-product-name {
      min-height: 36px;
      font-size: 13px;
    }

    .pos-product-price {
      font-size: 14px;
    }

    .pos-product-hint {
      display: none;
    }

    .pos-bill-header,
    .pos-cart-area,
    .pos-payment-area,
    .pos-total-area {
      padding-left: 14px;
      padding-right: 14px;
    }

    .pos-receipt-paper {
      margin: 0 8px 8px;
      padding: 22px 17px;
    }
  }

  @media (max-width: 390px) {
    .pos-products-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .pos-product-image {
      height: 100px;
    }

    .pos-product-info {
      padding: 9px;
    }

    .pos-product-name {
      font-size: 12px;
    }

    .pos-product-price {
      font-size: 13px;
    }

    .pos-payment-grid {
      gap: 5px;
    }

    .pos-payment-button {
      font-size: 11px;
    }
  }

  @media print {
    body * {
      visibility: hidden !important;
    }

    .pos-receipt-overlay,
    .pos-receipt-overlay * {
      visibility: visible !important;
    }

    .pos-receipt-overlay {
      position: static !important;
      inset: auto !important;
      width: 100% !important;
      height: auto !important;
      padding: 0 !important;
      overflow: visible !important;
      background: white !important;
    }

    .pos-receipt-modal {
      width: 100% !important;
      max-height: none !important;
      overflow: visible !important;
      border-radius: 0 !important;
      box-shadow: none !important;
    }

    .pos-receipt-actions {
      display: none !important;
    }

    .pos-receipt-paper {
      width: 80mm !important;
      margin: 0 auto !important;
      padding: 5mm !important;
      box-shadow: none !important;
    }

    .no-print {
      display: none !important;
    }
  }
`;

function POS() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedShopId, setSelectedShopId] =
    useState<number | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  const [paymentMethod, setPaymentMethod] =
    useState("Cash");

  const [loading, setLoading] = useState(true);
  const [generatingBill, setGeneratingBill] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [completedOrder, setCompletedOrder] =
    useState<CompletedOrder | null>(null);

  const [receiptShop, setReceiptShop] =
    useState<Shop | null>(null);

  const [showReceipt, setShowReceipt] =
    useState(false);

  async function loadPOSData() {
    try {
      setLoading(true);
      setError("");

      const [shopData, productData] =
        await Promise.all([
          fetchShops(),
          fetchProducts(),
        ]);

      setShops(shopData);
      setProducts(productData);

      if (
        selectedShopId === null &&
        shopData.length > 0
      ) {
        setSelectedShopId(shopData[0].id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load POS data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPOSData();
  }, []);

  const selectedShop = useMemo(() => {
    return shops.find(
      (shop) => shop.id === selectedShopId,
    );
  }, [shops, selectedShopId]);

  const shopIsOpen = useMemo(() => {
    if (!selectedShop) {
      return false;
    }

    if (
      typeof selectedShop.is_open ===
      "boolean"
    ) {
      return selectedShop.is_open;
    }

    return (
      selectedShop.status?.toLowerCase() ===
      "open"
    );
  }, [selectedShop]);

  /*
   * IMPORTANT:
   * POS only works with ACTIVE products.
   * Inactive products remain visible in the
   * Products management page but cannot be sold.
   */
  const shopProducts = useMemo(() => {
    if (selectedShopId === null) {
      return [];
    }

    return products.filter(
      (product) =>
        product.shop_id === selectedShopId &&
        product.is_active,
    );
  }, [products, selectedShopId]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        shopProducts.map(
          (product) => product.category,
        ),
      ),
    );

    return ["All", ...uniqueCategories];
  }, [shopProducts]);

  const filteredProducts = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return shopProducts.filter((product) => {
      const matchesSearch =
        !searchText ||
        product.name
          .toLowerCase()
          .includes(searchText);

      const matchesCategory =
        selectedCategory === "All" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [
    shopProducts,
    search,
    selectedCategory,
  ]);

  const totalItems = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total + item.quantity,
      0,
    );
  }, [cart]);

  const totalAmount = useMemo(() => {
    return cart.reduce(
      (total, item) =>
        total +
        item.product.price * item.quantity,
      0,
    );
  }, [cart]);

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  }

  function getProductImage(product: Product) {
    if (product.image) {
      return product.image;
    }

    return (
      categoryImages[product.category] ||
      "/menu/evening-snacks.jpg"
    );
  }

  function getCartQuantity(productId: number) {
    return (
      cart.find(
        (item) =>
          item.product.id === productId,
      )?.quantity || 0
    );
  }

  function addToCart(product: Product) {
    if (!shopIsOpen) {
      setError(
        "This shop is currently closed.",
      );
      return;
    }

    setError("");
    setSuccess("");

    setCart((currentCart) => {
      const existingItem =
        currentCart.find(
          (item) =>
            item.product.id === product.id,
        );

      if (existingItem) {
        return currentCart.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity:
                  item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          product,
          quantity: 1,
        },
      ];
    });
  }

  function increaseQuantity(
    productId: number,
  ) {
    if (!shopIsOpen) {
      return;
    }

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity:
                item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseQuantity(
    productId: number,
  ) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity:
                  item.quantity - 1,
              }
            : item,
        )
        .filter(
          (item) => item.quantity > 0,
        ),
    );
  }

  function removeFromCart(
    productId: number,
  ) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          item.product.id !== productId,
      ),
    );
  }

  function clearCart() {
    setCart([]);
    setSuccess("");
  }

  function handleShopChange(
    shopId: number,
  ) {
    setSelectedShopId(shopId);
    setCart([]);
    setSearch("");
    setSelectedCategory("All");
    setSuccess("");
    setError("");
  }

  function speakBill(
    orderItems: CartItem[] = cart,
    amount: number = totalAmount,
    method: string = paymentMethod,
  ) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      setError(
        "Voice billing is not supported in this browser.",
      );
      return;
    }

    if (orderItems.length === 0) {
      setError("Cart is empty.");
      return;
    }

    window.speechSynthesis.cancel();

    const itemText = orderItems
      .map(
        (item) =>
          `${item.product.name}, quantity ${item.quantity}`,
      )
      .join(". ");

    const message =
      `Bill generated. ` +
      `${itemText}. ` +
      `Total amount is ${amount.toFixed(2)} rupees. ` +
      `Payment method is ${method}.`;

    const utterance =
      new SpeechSynthesisUtterance(message);

    utterance.rate = 0.9;
    utterance.pitch = 1;

    window.speechSynthesis.speak(
      utterance,
    );
  }

  async function generateBill() {
    if (!selectedShopId) {
      setError("Please select a shop.");
      return;
    }

    if (!selectedShop) {
      setError(
        "Selected shop was not found.",
      );
      return;
    }

    if (!shopIsOpen) {
      setError(
        "Cannot generate a bill for a closed shop.",
      );
      return;
    }

    if (cart.length === 0) {
      setError(
        "Add at least one product to the cart.",
      );
      return;
    }

    try {
      setGeneratingBill(true);
      setError("");
      setSuccess("");

      const orderItems = cart.map((item) => ({
        product_id: item.product.id,
        product_name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        subtotal:
          item.product.price *
          item.quantity,
      }));

      const order = await createOrder({
        shop_id: selectedShopId,
        total: totalAmount,
        payment_method: paymentMethod,
        items: orderItems,
      });

      setCompletedOrder(order);

      setReceiptShop({
        ...selectedShop,
      });

      setShowReceipt(true);

      setSuccess(
        `Bill #${order.id} generated successfully.`,
      );

      speakBill(
        cart,
        totalAmount,
        paymentMethod,
      );

      setCart([]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate bill.",
      );
    } finally {
      setGeneratingBill(false);
    }
  }

  function printReceipt() {
    if (
      !completedOrder ||
      !receiptShop
    ) {
      return;
    }

    window.print();
  }

  function closeReceipt() {
    setShowReceipt(false);
  }

  return (
    <>
      <style>{POS_STYLE}</style>

      <div className="page-container pos-root">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "18px",
            marginBottom: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: "28px",
                  fontWeight: 750,
                  letterSpacing: "-0.5px",
                }}
              >
                Point of Sale
              </h1>

              <span
                className={`pos-status-badge ${
                  shopIsOpen
                    ? "open"
                    : "closed"
                }`}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background:
                      "currentColor",
                    marginRight: "6px",
                  }}
                />

                {shopIsOpen
                  ? "OPEN"
                  : "CLOSED"}
              </span>
            </div>

            <p
              style={{
                margin: "6px 0 0",
                color: "var(--text-secondary)",
                fontSize: "13px",
              }}
            >
              Take orders, build bills and
              process payments quickly.
            </p>
          </div>

          <button
            type="button"
            className="pos-refresh-button"
            onClick={loadPOSData}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "pos-spin"
                  : ""
              }
            />

            Refresh Menu
          </button>
        </div>

        <div className="dashboard-panel pos-shop-panel">
          <div className="pos-shop-panel-inner">
            <div className="pos-shop-info">
              <div className="pos-shop-icon">
                <Store size={20} />
              </div>

              <div className="pos-shop-details">
                <span className="pos-shop-name">
                  {selectedShop?.name ||
                    "No shop selected"}
                </span>

                <div className="pos-shop-location">
                  {selectedShop?.location ||
                    "Select a shop to begin"}
                </div>
              </div>
            </div>

            <div className="pos-shop-selector">
              <label
                htmlFor="pos-shop"
                className="pos-shop-label"
              >
                Current Shop
              </label>

              <div className="pos-select-wrap">
                <select
                  id="pos-shop"
                  className="pos-select"
                  value={
                    selectedShopId ?? ""
                  }
                  onChange={(event) =>
                    handleShopChange(
                      Number(
                        event.target.value,
                      ),
                    )
                  }
                >
                  {shops.length === 0 && (
                    <option value="">
                      No shops available
                    </option>
                  )}

                  {shops.map((shop) => (
                    <option
                      key={shop.id}
                      value={shop.id}
                    >
                      {shop.name}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={16}
                  className="pos-select-icon"
                />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="pos-alert pos-alert-error">
            <XCircle size={18} />

            <span>{error}</span>

            <button
              type="button"
              className="pos-alert-close"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {success && (
          <div className="pos-alert pos-alert-success">
            <CheckCircle2 size={18} />

            <span>{success}</span>

            <button
              type="button"
              className="pos-alert-close"
              onClick={() =>
                setSuccess("")
              }
              aria-label="Dismiss success"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="pos-main-grid">
          <div>
            <div className="dashboard-panel pos-menu-panel">
              <div className="pos-search-row">
                <div className="pos-search-wrap">
                  <Search
                    size={18}
                    className="pos-search-icon"
                  />

                  <input
                    type="text"
                    className="pos-search-input"
                    placeholder="Search menu items..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value,
                      )
                    }
                  />

                  {search && (
                    <button
                      type="button"
                      className="pos-search-clear"
                      onClick={() =>
                        setSearch("")
                      }
                      aria-label="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="pos-item-count">
                  <ShoppingCart size={16} />

                  {totalItems} item
                  {totalItems !== 1
                    ? "s"
                    : ""}
                </div>
              </div>

              <div className="pos-category-scroll">
                {categories.map(
                  (category) => {
                    const active =
                      selectedCategory ===
                      category;

                    const categoryCount =
                      category === "All"
                        ? shopProducts.length
                        : shopProducts.filter(
                            (product) =>
                              product.category ===
                              category,
                          ).length;

                    return (
                      <button
                        key={category}
                        type="button"
                        className={`pos-category-button ${
                          active
                            ? "active"
                            : ""
                        }`}
                        onClick={() =>
                          setSelectedCategory(
                            category,
                          )
                        }
                      >
                        {category}

                        <span className="pos-category-count">
                          {categoryCount}
                        </span>
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="pos-product-heading">
              <div>
                <span className="pos-product-heading-title">
                  {selectedCategory ===
                  "All"
                    ? "All Products"
                    : selectedCategory}
                </span>

                <span className="pos-product-heading-count">
                  {filteredProducts.length}{" "}
                  available
                </span>
              </div>

              {!shopIsOpen &&
                selectedShop && (
                  <span className="pos-closed-note">
                    <Clock3 size={15} />
                    Shop is closed
                  </span>
                )}
            </div>

            {loading ? (
              <div className="dashboard-panel pos-state-panel">
                <div className="pos-state">
                  <RefreshCw
                    size={30}
                    className="pos-spin"
                  />

                  <p
                    style={{
                      marginTop: "12px",
                    }}
                  >
                    Loading menu...
                  </p>
                </div>
              </div>
            ) : shopProducts.length ===
              0 ? (
              <div className="dashboard-panel pos-state-panel">
                <div className="pos-state">
                  <div className="pos-state-icon">
                    <ShoppingCart
                      size={34}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3>
                    No active products available
                  </h3>

                  <p>
                    This shop currently has no
                    active products available
                    for sale.
                  </p>
                </div>
              </div>
            ) : filteredProducts.length ===
              0 ? (
              <div className="dashboard-panel pos-state-panel">
                <div className="pos-state">
                  <div className="pos-state-icon">
                    <Search
                      size={34}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h3>
                    No matching products
                  </h3>

                  <p>
                    Try another search or
                    category.
                  </p>

                  <button
                    type="button"
                    className="pos-clear-filters"
                    onClick={() => {
                      setSearch("");
                      setSelectedCategory(
                        "All",
                      );
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="pos-products-grid">
                {filteredProducts.map(
                  (product) => {
                    const quantity =
                      getCartQuantity(
                        product.id,
                      );

                    const selected =
                      quantity > 0;

                    return (
                      <button
                        key={product.id}
                        type="button"
                        className={`pos-product-card ${
                          selected
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          addToCart(
                            product,
                          )
                        }
                        disabled={
                          !shopIsOpen
                        }
                        aria-label={`Add ${product.name} to bill`}
                      >
                        <div className="pos-product-image-wrap">
                          <img
                            src={getProductImage(
                              product,
                            )}
                            alt={
                              product.name
                            }
                            className="pos-product-image"
                            loading="lazy"
                          />

                          {selected && (
                            <div className="pos-product-added">
                              <CheckCircle2
                                size={12}
                              />
                              Added
                            </div>
                          )}

                          {quantity > 0 && (
                            <div className="pos-product-quantity">
                              ×{quantity}
                            </div>
                          )}
                        </div>

                        <div className="pos-product-info">
                          <div className="pos-product-name">
                            {product.name}
                          </div>

                          <div className="pos-product-bottom">
                            <strong className="pos-product-price">
                              {formatCurrency(
                                product.price,
                              )}
                            </strong>

                            <span className="pos-product-hint">
                              {selected
                                ? "Tap +1"
                                : "Tap to add"}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  },
                )}
              </div>
            )}
          </div>

          <div className="dashboard-panel pos-bill-panel">
            <div className="pos-bill-header">
              <div className="pos-bill-title-wrap">
                <div className="pos-bill-icon">
                  <ShoppingCart size={19} />
                </div>

                <div>
                  <h2 className="pos-bill-title">
                    Current Bill
                  </h2>

                  <span className="pos-bill-subtitle">
                    {totalItems} item
                    {totalItems !== 1
                      ? "s"
                      : ""}
                  </span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  type="button"
                  className="pos-clear-button"
                  onClick={clearCart}
                  title="Clear bill"
                  aria-label="Clear bill"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            <div className="pos-cart-area">
              <div className="pos-cart-list">
                {cart.length === 0 ? (
                  <div className="pos-empty-cart">
                    <div className="pos-empty-cart-icon">
                      <ShoppingCart
                        size={30}
                        strokeWidth={1.5}
                      />
                    </div>

                    <h3>
                      Your bill is empty
                    </h3>

                    <p>
                      Tap any menu item to
                      add it to the bill.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="pos-cart-item"
                    >
                      <div
                        style={{
                          minWidth: 0,
                        }}
                      >
                        <strong className="pos-cart-item-name">
                          {
                            item.product
                              .name
                          }
                        </strong>

                        <div className="pos-cart-item-price">
                          {formatCurrency(
                            item.product
                              .price,
                          )}{" "}
                          each
                        </div>

                        <div className="pos-cart-controls">
                          <button
                            type="button"
                            className="pos-icon-button minus"
                            onClick={() =>
                              decreaseQuantity(
                                item
                                  .product
                                  .id,
                              )
                            }
                            aria-label={`Decrease ${item.product.name}`}
                          >
                            <Minus size={13} />
                          </button>

                          <strong className="pos-cart-quantity">
                            {item.quantity}
                          </strong>

                          <button
                            type="button"
                            className="pos-icon-button plus"
                            onClick={() =>
                              increaseQuantity(
                                item
                                  .product
                                  .id,
                              )
                            }
                            aria-label={`Increase ${item.product.name}`}
                          >
                            <Plus size={13} />
                          </button>

                          <button
                            type="button"
                            className="pos-icon-button remove"
                            onClick={() =>
                              removeFromCart(
                                item
                                  .product
                                  .id,
                              )
                            }
                            aria-label={`Remove ${item.product.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>

                      <strong className="pos-cart-subtotal">
                        {formatCurrency(
                          item.product.price *
                            item.quantity,
                        )}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pos-total-area">
              <div className="pos-total-items">
                <span>Items</span>
                <span>{totalItems}</span>
              </div>

              <div className="pos-total-row">
                <strong className="pos-total-label">
                  Total
                </strong>

                <strong className="pos-total-value">
                  {formatCurrency(
                    totalAmount,
                  )}
                </strong>
              </div>
            </div>

            <div className="pos-payment-area">
              <label className="pos-payment-label">
                Payment Method
              </label>

              <div className="pos-payment-grid">
                {[
                  "Cash",
                  "UPI",
                  "Card",
                ].map((method) => {
                  const active =
                    paymentMethod ===
                    method;

                  return (
                    <button
                      key={method}
                      type="button"
                      className={`pos-payment-button ${
                        active
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        setPaymentMethod(
                          method,
                        )
                      }
                    >
                      {method}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="pos-primary-button"
                onClick={generateBill}
                disabled={
                  generatingBill ||
                  cart.length === 0 ||
                  !shopIsOpen
                }
              >
                {generatingBill ? (
                  <>
                    <RefreshCw
                      size={17}
                      className="pos-spin"
                    />
                    Generating Bill...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={18} />
                    Generate Bill
                  </>
                )}
              </button>

              <button
                type="button"
                className="pos-secondary-button"
                onClick={() =>
                  speakBill()
                }
                disabled={
                  cart.length === 0
                }
              >
                <Volume2 size={16} />
                Preview Voice Bill
              </button>
            </div>
          </div>
        </div>

        {showReceipt &&
          completedOrder &&
          receiptShop && (
            <div
              className="modal-overlay receipt-overlay pos-receipt-overlay"
              onMouseDown={(event) => {
                if (
                  event.target ===
                  event.currentTarget
                ) {
                  closeReceipt();
                }
              }}
            >
              <div className="receipt-modal pos-receipt-modal">
                <div className="pos-receipt-actions no-print">
                  <button
                    type="button"
                    className="pos-receipt-action secondary"
                    onClick={
                      closeReceipt
                    }
                  >
                    <X size={16} />
                    Close
                  </button>

                  <button
                    type="button"
                    className="pos-receipt-action primary"
                    onClick={
                      printReceipt
                    }
                  >
                    <Printer size={16} />
                    Print Receipt
                  </button>
                </div>

                <div className="receipt-paper pos-receipt-paper">
                  <div className="pos-receipt-header">
                    <h1>SnackFlow</h1>

                    <h2>
                      {receiptShop.name}
                    </h2>

                    <p>
                      {receiptShop.location}
                    </p>

                    {receiptShop.phone && (
                      <p>
                        Tel:{" "}
                        {
                          receiptShop.phone
                        }
                      </p>
                    )}
                  </div>

                  <div className="pos-receipt-divider" />

                  <div className="pos-receipt-info">
                    <div>
                      <span>
                        Bill No.
                      </span>

                      <strong>
                        #
                        {
                          completedOrder.id
                        }
                      </strong>
                    </div>

                    <div>
                      <span>Date</span>

                      <strong>
                        {formatDate(
                          completedOrder.created_at,
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="pos-receipt-divider" />

                  <div className="pos-receipt-items">
                    {completedOrder.items.map(
                      (item) => (
                        <div
                          className="pos-receipt-item"
                          key={
                            item.product_id
                          }
                        >
                          <div>
                            <strong>
                              {
                                item.product_name
                              }
                            </strong>

                            <small>
                              {
                                item.quantity
                              }{" "}
                              ×{" "}
                              {formatCurrency(
                                item.price,
                              )}
                            </small>
                          </div>

                          <strong>
                            {formatCurrency(
                              item.subtotal,
                            )}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>

                  <div className="pos-receipt-divider" />

                  <div className="pos-receipt-total">
                    <span>TOTAL</span>

                    <strong>
                      {formatCurrency(
                        completedOrder.total,
                      )}
                    </strong>
                  </div>

                  <div className="pos-receipt-payment">
                    <span>
                      Payment
                    </span>

                    <strong>
                      {
                        completedOrder.payment_method
                      }
                    </strong>
                  </div>

                  <div className="pos-receipt-footer">
                    <p>
                      Thank you for visiting!
                    </p>

                    <p>
                      Powered by SnackFlow
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </>
  );
}

export default POS;