import { useNavigation } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../types/RootStackType';
import { DrawerNavigationProp } from '@react-navigation/drawer';

const useCustomNavigation = (screenName: keyof RootStackParamList) => {

  type Props = StackScreenProps<RootStackParamList, typeof screenName>;
  // type ScreenNavigationProp = Props['navigation'];
  type ScreenNavigationProp = DrawerNavigationProp<RootStackParamList, typeof screenName>;


  const navigation = useNavigation<ScreenNavigationProp>();
  return navigation;

};

export default useCustomNavigation;
