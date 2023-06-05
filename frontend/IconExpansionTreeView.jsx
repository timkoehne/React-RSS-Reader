import * as React from 'react';
import PropTypes from 'prop-types';
import TreeView from '@mui/lab/TreeView';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TreeItem, { useTreeItem } from '@mui/lab/TreeItem';
import clsx from 'clsx';
import Typography from '@mui/material/Typography';

const CustomContent = React.forwardRef(function CustomContent(props, ref) {
  const {
    classes,
    className,
    label,
    nodeId,
    icon: iconProp,
    expansionIcon,
    displayIcon,
  } = props;

  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection,
  } = useTreeItem(nodeId);

  const icon = iconProp || expansionIcon || displayIcon;

  const handleMouseDown = (event) => {
    //console.log("handleMouseDown")
    preventSelection(event);
  };

  const handleExpansionClick = (event) => {
    //console.log("handleExpansionClick")
    handleExpansion(event);
  };

  const handleSelectionClick = (event) => {
    //console.log("handleSelectionClick")
    //console.log(event)
    handleSelection(event);
  };

  return (
    <div
      className={clsx(className, classes.root, {
        [classes.expanded]: expanded,
        [classes.selected]: selected,
        [classes.focused]: focused,
        [classes.disabled]: disabled,
      })}
      onMouseDown={handleMouseDown}
      ref={ref}
    >
      <div onClick={handleExpansionClick} className={classes.iconContainer}>
        {icon}
      </div>
      <Typography
        onClick={handleSelectionClick}
        component="div"
        className={classes.label}
      >
        {label}
      </Typography>
    </div>
  );
});

CustomContent.propTypes = {
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object.isRequired,
  /**
   * className applied to the root element.
   */
  className: PropTypes.string,
  /**
   * The icon to display next to the tree node's label. Either a parent or end icon.
   */
  displayIcon: PropTypes.node,
  /**
   * The icon to display next to the tree node's label. Either an expansion or collapse icon.
   */
  expansionIcon: PropTypes.node,
  /**
   * The icon to display next to the tree node's label.
   */
  icon: PropTypes.node,
  /**
   * The tree node label.
   */
  label: PropTypes.node,
  /**
   * The id of the node.
   */
  nodeId: PropTypes.string.isRequired,
};

function CustomTreeItem(props) {
  return <TreeItem ContentComponent={CustomContent} {...props} />;
}

function mapToTree(treeData) {
  return treeData.map((data, index) => {
    const { nodeId, label, children } = data;

    return (
      <CustomTreeItem key={index} nodeId={nodeId} label={label}>
        {(children !== undefined && children.length > 0) && mapToTree(children)}
      </CustomTreeItem>
    )
  })
}


export function findNode(searchId, inData) {
  //console.log("searching for nodeId " + searchId)
  for (var i = 0; i < inData.length; i++) {
    if (inData[i].nodeId === searchId) {
      return inData[i]
    } else if ((inData[i].children !== undefined && inData[i].children.length > 0)) {

      var subtree = findNode(searchId, inData[i].children)
      if (subtree){
        return subtree
      }
    }
  }
}


export default function IconExpansionTreeView({ treeData, onClick }) {

  function findPath(searchId) {
    var path = ""
    var node = findNode(searchId, treeData)
     if (node.parentId !== "root") {
       path = findPath(node.parentId) + "/" + path
     }
    return path + node.label
  }

  return (

    <TreeView
      aria-label="icon expansion"
      defaultCollapseIcon={<ExpandMoreIcon />}
      defaultExpandIcon={<ChevronRightIcon />}
      defaultExpanded={["0"]}
      //onNodeToggle={}
      onNodeSelect={(event, nodeId) => {
      var currentPath = findPath(nodeId)
        onClick(nodeId, currentPath)
      }}
      sx={{ height: "100%", flexGrow: 1, maxWidth: 400, overflowY: 'auto', textAlign: 'left' }}
    >
      {mapToTree(treeData)}
    </TreeView >
  );
}