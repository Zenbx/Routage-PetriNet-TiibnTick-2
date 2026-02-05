package com.delivery.optimization.mapper;

import com.delivery.optimization.dto.ETAResponse;
import com.delivery.optimization.domain.KalmanState;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface DeliveryMapper {

    @Mapping(target = "kalmanState.distanceCovered", source = "distanceCovered")
    @Mapping(target = "kalmanState.estimatedSpeed", source = "estimatedSpeed")
    @Mapping(target = "kalmanState.trafficBias", source = "trafficBias")
    @Mapping(target = "etaMin", ignore = true)
    @Mapping(target = "etaMax", ignore = true)
    @Mapping(target = "confidence", ignore = true)
    @Mapping(target = "remainingDistance", ignore = true)
    @Mapping(target = "currentLatitude", ignore = true)
    @Mapping(target = "currentLongitude", ignore = true)
    ETAResponse toETAResponse(KalmanState state);
}
