import mainnet from "./assets/mainnet.jpg"
import arbitrum from "./assets/arbitrum.jpg"
import avalanche from "./assets/avalanche.jpg"
import bsc from "./assets/bsc.jpg"
import gnosis from "./assets/gnosis.jpg"
import polygon from "./assets/polygon.jpg"
import classes from "./ChainIcon.module.css"
import clsx from "clsx"
import { StaticImageData } from "next/image"

interface IconList {
  [key: number]: {
    image: StaticImageData
    name: string
  }
}

const icons: IconList = {
  1: { image: mainnet, name: "mainnet" },
  42161: { image: arbitrum, name: "arbitrum" },
  43114: { image: avalanche, name: "avalanche" },
  56: { image: bsc, name: "bsc" },
  137: { image: polygon, name: "polygon" },
  100: { image: gnosis, name: "gnosis" },
}

interface IconProps {
  width?: number
  height?: number
  className?: string
}

interface ChainIconProps extends IconProps {
  chainId: number
}

const ChainIcon: React.FC<ChainIconProps> = ({
  chainId,
  width,
  height,
  className,
}) => {
  const supported = Object.keys(icons).includes(chainId.toString())

  if (!supported) {
    return (
      <DefaultIcon
        width={width}
        height={height}
        className={clsx(classes.icon, className)}
      />
    )
  }

  return (
    <svg
      viewBox="0 0 54 59"
      fill="none"
      width={width}
      height={height}
      className={clsx(classes.icon, className)}
    >
      <defs>
        <clipPath id="mask">
          <path d="M17.033 4.964c3.852-2.262 5.778-3.393 7.84-3.77a11.807 11.807 0 0 1 4.254 0c2.062.377 3.988 1.508 7.84 3.77l6.066 3.562c3.852 2.263 5.777 3.394 7.13 5.022a12.268 12.268 0 0 1 2.127 3.747c.71 2.006.71 4.268.71 8.793v7.124c0 4.525 0 6.787-.71 8.793a12.268 12.268 0 0 1-2.126 3.747c-1.354 1.628-3.28 2.76-7.131 5.022l-6.066 3.562c-3.852 2.262-5.778 3.393-7.84 3.771a11.814 11.814 0 0 1-4.254 0c-2.062-.378-3.988-1.509-7.84-3.77l-6.066-3.563c-3.852-2.263-5.778-3.394-7.13-5.022a12.268 12.268 0 0 1-2.127-3.747C1 40 1 37.737 1 33.212v-7.124c0-4.525 0-6.787.71-8.793a12.268 12.268 0 0 1 2.127-3.747c1.352-1.628 3.278-2.76 7.13-5.022l6.066-3.562Z"></path>
        </clipPath>
      </defs>
      <image
        clipPath="url(#mask)"
        width="58"
        height="59"
        x="-2"
        y="0"
        href={icons[chainId].image.src}
      ></image>
    </svg>
  )
}

const DefaultIcon: React.FC<IconProps> = ({ width, height, className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 28 28"
      width={width}
      height={height}
      className={clsx(classes.icon, className)}
    >
      <title>Testnet</title>
      <mask
        id="p"
        width="26"
        height="28"
        x="1"
        y="0"
        maskUnits="userSpaceOnUse"
        style={{ maskType: "alpha" }}
      >
        <path
          fill="#D9D9D9"
          d="M12 1.172a4 4 0 0 1 4 0l8.124 4.69a4 4 0 0 1 2 3.465v9.381a4 4 0 0 1-2 3.464L16 26.862a4 4 0 0 1-4 0l-8.124-4.69a4 4 0 0 1-2-3.464V9.327a4 4 0 0 1 2-3.464L12 1.173Z"
        ></path>
      </mask>
      <g mask="url(#p)">
        <path
          id="network-placeholder-fill"
          fill="#fff"
          d="M0 0h28v28H0z"
        ></path>
        <path
          fill="#798686"
          stroke="#fff"
          d="M14.243 13.563 14 13.428l-.243.135-6.388 3.549-.024.013c-.432.24-.79.44-1.053.622-.266.184-.516.405-.636.722a1.5 1.5 0 0 0 0 1.062c.12.317.37.538.636.722.263.183.62.382 1.053.622l.024.013 3.164 1.758.088.049c1.164.646 1.857 1.032 2.607 1.162.51.09 1.033.09 1.544 0 .75-.13 1.443-.516 2.606-1.162l.09-.05 3.163-1.757.024-.013c.432-.24.79-.44 1.053-.622.266-.184.516-.405.636-.722l-.468-.177.468.177a1.5 1.5 0 0 0 0-1.062l-.468.177.468-.177c-.12-.317-.37-.538-.636-.722-.263-.183-.62-.382-1.053-.622l-.024-.013-6.388-3.55Z"
        ></path>
        <path
          fill="#9EA9A9"
          stroke="#fff"
          d="M14.243 8.563 14 8.428l-.243.135-6.388 3.549-.024.013c-.432.24-.79.44-1.053.622-.266.184-.516.405-.636.722a1.5 1.5 0 0 0 0 1.062c.12.316.37.537.636.722.263.183.62.382 1.053.622l.024.013 3.164 1.758.088.049c1.164.646 1.857 1.032 2.607 1.162.51.09 1.033.09 1.544 0 .75-.13 1.443-.516 2.606-1.162l.09-.05 3.163-1.757.024-.013c.432-.24.79-.44 1.053-.622.266-.184.516-.405.636-.722l-.468-.177.468.177a1.5 1.5 0 0 0 0-1.062l-.468.177.468-.177c-.12-.316-.37-.537-.636-.722-.263-.183-.62-.382-1.053-.622l-.024-.013-6.388-3.55Z"
        ></path>
        <path
          fill="#C9CFCF"
          stroke="#fff"
          d="m22.344 9.53-.468-.176.468.177a1.5 1.5 0 0 0 0-1.062l-.468.177.468-.177c-.12-.317-.37-.537-.636-.722-.263-.183-.62-.382-1.053-.622l-.024-.013-3.163-1.758-.09-.05c-1.163-.645-1.856-1.03-2.606-1.161a4.5 4.5 0 0 0-1.544 0c-.75.13-1.443.516-2.607 1.162l-.088.05-3.164 1.757-.024.013c-.432.24-.79.44-1.053.622-.266.185-.516.405-.636.722a1.5 1.5 0 0 0 0 1.062c.12.317.37.537.636.722.263.183.62.382 1.053.622l.024.013 3.164 1.758.088.049c1.164.646 1.857 1.032 2.607 1.162.51.09 1.033.09 1.544 0 .75-.13 1.443-.516 2.606-1.162l.09-.05 3.163-1.757.024-.013c.432-.24.79-.44 1.053-.622.266-.184.516-.405.636-.722Z"
        ></path>
      </g>
    </svg>
  )
}

export default ChainIcon
