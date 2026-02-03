package com.delivery.optimization.mapper;

import com.delivery.optimization.domain.KalmanState;
import com.delivery.optimization.dto.ETAResponse;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-02-03T17:30:26+0100",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.9 (Eclipse Adoptium)"
)
@Component
public class DeliveryMapperImpl implements DeliveryMapper {

    @Override
    public ETAResponse toETAResponse(KalmanState state) {
        if ( state == null ) {
            return null;
        }

        ETAResponse.ETAResponseBuilder eTAResponse = ETAResponse.builder();

        eTAResponse.kalmanState( kalmanStateToKalmanStateDTO( state ) );

        return eTAResponse.build();
    }

    protected ETAResponse.KalmanStateDTO kalmanStateToKalmanStateDTO(KalmanState kalmanState) {
        if ( kalmanState == null ) {
            return null;
        }

        ETAResponse.KalmanStateDTO.KalmanStateDTOBuilder kalmanStateDTO = ETAResponse.KalmanStateDTO.builder();

        if ( kalmanState.getDistanceCovered() != null ) {
            kalmanStateDTO.distanceCovered( kalmanState.getDistanceCovered() );
        }
        if ( kalmanState.getEstimatedSpeed() != null ) {
            kalmanStateDTO.estimatedSpeed( kalmanState.getEstimatedSpeed() );
        }
        if ( kalmanState.getTrafficBias() != null ) {
            kalmanStateDTO.trafficBias( kalmanState.getTrafficBias() );
        }

        return kalmanStateDTO.build();
    }
}
