import React, { Component } from 'react';
import {
    View,
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;
class Deck extends Component {

    static defaultProps={
        onSwipeRight: ()=>{},
        onSwipeLeft: () =>{}
    };

    constructor(props) {
        super(props);
        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                //manually update position object
                position.setValue({x:gesture.dx,y:gesture.dy});
            },
            onPanResponderRelease: (event,gesture) => {
                if(gesture.dx > SWIPE_THRESHOLD){
                    this.forceSwipe('right');
                }
                else if(gesture.dx < -SWIPE_THRESHOLD){
                    this.forceSwipe('left')
                }else{
                    this.resetPosition();
                }

            }
        });

        this.state = { panResponder, position, index: 0 };
    }

    componentWillUpdate(){
        //for android
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        //animate any changes to the component with spring
        LayoutAnimation.spring();
    }

    //called when component is re-render with new set of props
    componentWillReceiveProps(nextProps){
        if(nextProps.data !== this.props.data){
            this.setState ({index:0})
        }
    }

    forceSwipe(direction){
        const x = direction ==='right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        Animated.timing(this.state.position,{
            toValue:{x ,y:0},
            duration:SWIPE_OUT_DURATION
        }).start(()=>{this.onSwipeComplete(direction)});
    }

    onSwipeComplete(direction){
        const {onSwipeRight,onSwipeLeft, data} = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
        this.state.position.setValue({x:0,y:0});
        this.setState({index: ++this.state.index});

    }

    resetPosition(){
        Animated.spring(this.state.position,{
            toValue:{x:0,y:0}
        }).start();
    }

    //styling to top card in our deck (to handle the position for animation)
    getCardStyle(){
        const {position} = this.state;
        //interpolation
        const rotate = position.x.interpolate({
            inputRange:[-SCREEN_WIDTH*1.5, 0 ,SCREEN_WIDTH*1.5],
            outputRange: ['-120deg','0deg','120deg']
        });

        return {
            //get layout returns an object, and we want to return one single object,
            // to take all individual property and apply it to our view.
            ...position.getLayout(),
            transform: [{rotate}]
        }
    }


    renderCards() {
        if( this.state.index >= this.props.data.length){
            return this.props.renderNoMoreCards();
        }
        //index represent index in array.
        return this.props.data.map((item,i) => {
            //if there is no more cards, do not render anything else.
            if (i < this.state.index) {
                return null;
            }

            //if the current data, matches the data in the state, we load the card with animation.
            if(i === this.state.index){
                return (
                    <Animated.View key={item.id} {...this.state.panResponder.panHandlers} style={[this.getCardStyle(),styles.cardStyle]}>
                        {this.props.renderCard(item)}
                    </Animated.View>
                )
            }
            //else we load the rest of the cards without animation
            return (
                <Animated.View key={item.id} style={[styles.cardStyle,{top:10 * (i - this.state.index)}]}>
                    {this.props.renderCard(item)}
                </Animated.View>

            );
        }).reverse();
    }

    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles={
    cardStyle:{
        position: 'absolute',
        width:SCREEN_WIDTH
    }

};

export default Deck;