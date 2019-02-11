import React from 'react';
import _ from 'lodash';
import Grid from '@material-ui/core/Grid';
import {horizontalBox} from '../../../../../constants';
import ActionIcon from '../../../../../components/Buttons/ActionIcon';
import FirstRow from './CustomRows/FirstRow';
import OtherRow from './CustomRows/OtherRow';
import EditDialog from './EditDialog';
import {comparators, conditionalOperators} from '../../../constants';

export default class Entry extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            editDialogOpen: false,
            selectedCondition: 0
        };
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!_.isEqual(_.get(this.props, 'algo.entry', {}), _.get(nextProps, 'algo.entry', {})) 
                || !_.isEqual(this.state, nextState)) {
            return true;
        }

        return false;
    }

    onComparatorChange = (value, index) => {
        const {algo} = this.props;
        const entryConditions = _.map(_.get(algo, 'entry', []), _.cloneDeep);
        entryConditions[index]['comparator'] = value;
        const modifiedScript = {
            ...algo,
            entry: entryConditions
        };
        this.props.updateAlgo(modifiedScript);
    }

    onFirstValueChange = (value, index) => {
        const {algo} = this.props;
        const entryConditions = _.map(_.get(algo, 'entry', []), _.cloneDeep);
        entryConditions[index]['firstValue'] = value;
        const modifiedScript = {
            ...algo,
            entry: entryConditions
        };
        this.props.updateAlgo(modifiedScript);
    }

    onSecondValueChange = (value, index) => {
        const {algo} = this.props;
        const entryConditions = _.map(_.get(algo, 'entry', []), _.cloneDeep);
        entryConditions[index]['secondValue'] = value;
        const modifiedScript = {
            ...algo,
            entry: entryConditions
        };
        this.props.updateAlgo(modifiedScript);
    }

    onConditionChange = (value, index) => {
        const {algo} = this.props;
        const entryConditions = _.map(_.get(algo, 'entry', []), _.cloneDeep);
        entryConditions[index]['condition'] = value;
        const modifiedScript = {
            ...algo,
            entry: entryConditions
        };
        this.props.updateAlgo(modifiedScript);
    }

    addCondition = () => {
        const {algo} = this.props;
        const entryConditions = _.map(_.get(algo, 'entry', []), _.cloneDeep);
        if (entryConditions.length >= 5) {
            return;
        }
        entryConditions.push({
            condition: conditionalOperators[0].value, 
            firstValue: 0, 
            comparator: comparators[0].value, 
            secondValue: 0
        });
        const modifiedScript = {
            ...algo,
            entry: entryConditions
        };
        this.props.updateAlgo(modifiedScript);
    }

    updateSelectedCondition = index => {
        this.setState({selectedCondition: index}, () => {
            this.toggleEditDialog();
        })
    }

    toggleEditDialog = () => {
        this.setState({editDialogOpen: !this.state.editDialogOpen});
    }

    render() {
        const {algo} = this.props;
        const conditions = _.get(algo, 'entry', []);

        return (
            <Grid container>
                <EditDialog 
                    open={this.state.editDialogOpen}
                    onClose={this.toggleEditDialog}
                    algo={algo}
                    updateAlgo={this.props.updateAlgo}
                    selectedIndex={this.state.selectedCondition}
                />
                {
                    conditions.map((condition, index) => {
                        if (index === 0) {
                            return (
                                <FirstRow 
                                    index={index}
                                    condition={condition}
                                    onComparatorChange={this.onComparatorChange}
                                    onFirstValueChange={this.onFirstValueChange}
                                    onSecondValueChange={this.onSecondValueChange}
                                    onConditionChange={this.onConditionChange}
                                    toggleEditDialog={this.updateSelectedCondition}
                                />
                            );
                        } else {
                            return (
                                <OtherRow 
                                    index={index}
                                    condition={condition} 
                                    onComparatorChange={this.onComparatorChange}
                                    onFirstValueChange={this.onFirstValueChange}
                                    onSecondValueChange={this.onSecondValueChange}
                                    onConditionChange={this.onConditionChange}
                                    toggleEditDialog={this.updateSelectedCondition}
                                />
                            );
                        }
                    })
                }
                <Grid 
                        item 
                        xs={12} 
                        style={{
                            ...horizontalBox,
                            justifyContent: 'flex-start'
                        }}
                >
                    <ActionIcon type='add_circle' onClick={this.addCondition} />
                    <h3>Add Exit Condition</h3>
                </Grid>
            </Grid>
        );
    }
}