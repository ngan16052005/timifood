package com.timifood.backend.dto;

import lombok.Data;

@Data
public class CheckoutRequest {
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private String note;
    private String deliveryType;
    private String deliveryTime;
}
