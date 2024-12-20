"use client";
import { AlertsManager, createAlertsManager } from "@bigcommerce/big-design";
import {
  MessageLinkItem,
  MessagingType,
} from "@bigcommerce/big-design/dist/utils";
import { useEffect } from "react";

/**
 * Configuration for an alert message.
 */
export interface AddAlertConfig {
  /**
   * Type of the alert, such as success, error, info, etc.
   */
  type: MessagingType;

  /**
   * An array of messages to display in the alert.
   */
  messages: Array<{
    /**
     * Optional link associated with the message.
     */
    link?: MessageLinkItem;

    /**
     * The text content of the message.
     */
    text: string;
  }>;

  /**
   * Whether the alert should automatically dismiss after a timeout. Defaults to `false`.
   */
  autoDismiss?: boolean;

  /**
   * Optional header text for the alert.
   */
  header?: string;
}

const alertManager = createAlertsManager();

let queue: AddAlertConfig[] = [];
let isRendered = false;

export const addAlert = (config: AddAlertConfig) => {
  // const autoDismiss = config.autoDismiss ?? config.type === "success"; // Default autoDismiss to true for "success" type if not specified
  const autoDismiss = true; // Default autoDismiss to true for "success" type if not specified
  const alert = {
    ...config,
    autoDismiss,
    messages: config.messages?.length ? config.messages : [{ text: "" }],
  };

  if (isRendered) {
    alertManager.add(alert);
  } else {
    queue.push(alert);
  }
};

export const clear = () => {
  isRendered = false;
  queue = [];
};

const Alerts = () => {
  useEffect(() => {
    isRendered = true;
    queue.forEach((alert) => alertManager.add(alert));
    queue = [];

    return () => {
      isRendered = false;
    };
  }, []);

  return <AlertsManager manager={alertManager} />;
};

export default Alerts;
