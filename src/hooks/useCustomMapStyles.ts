import { useAppSelector } from "../redux/Store";

export const useCustomMapStyle = () => {

    const { colors } = useAppSelector(state => state.CommonSlice);

    return ([
        //place geometry location
        {
            featureType: "landscape",
            elementType: "all",
            stylers: [
                {
                    color: colors.MAP_AREA_COLOR
                }
            ]
        },
        //place geometry name
        {
            elementType: 'labels.text.fill',
            stylers: [
                {
                    color: colors.MAP_TEXT_COLOR,
                },
            ],
        },
        //park geometry
        {
            featureType: 'poi.park',
            elementType: 'geometry',
            stylers: [
                {
                    color: 'green',
                },
            ],
        },
        //sub road geometry
        {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [
                {
                    color: colors.MAP_ROAD_COLOR,
                },
            ],
        },
        {
            featureType: 'road.local',
            elementType: 'geometry',
            stylers: [
                {
                    color: colors.MAP_ROAD_COLOR,
                },
            ],
        },
        //highway geometry
        {
            featureType: 'road.highway',
            elementType: 'geometry',
            stylers: [
                {
                    color: colors.MAP_ROAD_COLOR,
                },
            ],
        },
        {
            featureType: 'road.highway',
            elementType: 'geometry.stroke',
            stylers: [
                {
                    color: colors.MAP_ROAD_COLOR,
                },
            ],
        },
        //icons
        {
            featureType: "poi",
            elementType: "all",
            stylers: [
                {
                    visibility: "on",
                }
            ]
        },
        //transpotaion
        {
            featureType: "transit",
            elementType: "all",
            stylers: [
                {
                    visibility: "off"
                }
            ]
        },
    ]
    );
};
