import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useGlobalStyles } from '../hooks/useGlobalStyles';
import { useAppSelector } from '../redux/Store';
import { FontSizes } from '../styles/FontSizes';
import { Fonts } from '../styles/Fonts';

interface Tab {
    title: string;
};

interface TopTabBarProps {
    tabs: Tab[];
    activeTab: number;
    onTabPress: (index: number) => void;
    containerStyle?: ViewStyle
};

const TopTabBar: React.FC<TopTabBarProps> = ({ tabs, activeTab, onTabPress, containerStyle }) => {

    const GlobalStyle = useGlobalStyles();
    const Styles = useStyles();

    return (
        <View style={[GlobalStyle.rowContainer, containerStyle]}>
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={index}
                    style={[
                        Styles.tab,
                        activeTab === index ? Styles.activeTab : Styles.inactiveTab,
                    ]}
                    onPress={() => onTabPress(index)}
                >
                    <Text style={[Styles.tabText, activeTab === index ? Styles.activeTabText : Styles.inactiveTabText]}>{tab.title}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default TopTabBar;

const useStyles = () => {

    const { colors } = useAppSelector((state) => state.CommonSlice);

    return StyleSheet.create({

        tab: {
            flex: 1,
            paddingVertical: wp(2.5),
            alignItems: 'center',
        },
        inactiveTab: {
            borderBottomColor: colors.SHADOW_1,
            borderBottomWidth: wp(1)
        },
        activeTab: {
            borderBottomColor: colors.SECONDARY,
            borderBottomWidth: wp(1)
        },
        tabText: {
            fontSize: FontSizes.FONT_SIZE_12,
            fontFamily: Fonts.FONT_POP_REGULAR
        },
        activeTabText: {
            color: colors.PRIMARY_TEXT,
            fontFamily: Fonts.FONT_POP_MEDIUM
        },
        inactiveTabText: {
            color: colors.SECONDARY_TEXT,
        },
    });
};
