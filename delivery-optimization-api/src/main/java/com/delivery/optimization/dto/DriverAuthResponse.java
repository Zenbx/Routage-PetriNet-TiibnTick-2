package com.delivery.optimization.dto;

import com.delivery.optimization.domain.Driver;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DriverAuthResponse {
    private String token;
    private DriverInfo driver;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DriverInfo {
        private String id;
        private String name;
        private String email;
        private String phone;
        private String vehicleType;
        private String licensePlate;
        private Driver.DriverStatus status;
    }
}
